import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpContextToken
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';

// Context token to bypass cache for a specific request
export const BYPASS_CACHE = new HttpContextToken<boolean>(() => false);

// Context token to override TTL per request (in ms)
export const CACHE_TTL = new HttpContextToken<number | null>(() => null);

interface CacheEntry {
  urlWithParams: string;
  response: HttpResponse<any>;
  addedAt: number;
  ttl: number; // milliseconds
}

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private inflightRequests = new Map<string, Observable<HttpEvent<any>>>();

  // Default TTL: 60 seconds
  private readonly defaultTtlMs = 60_000;

  // Policy table: set TTL or bypass based on URL patterns
  private readonly policies: Array<{ pattern: RegExp; ttlMs?: number; bypass?: boolean }> = [
    { pattern: /\/missions(\/|\?|$)/i, ttlMs: 5_000 },
    { pattern: /\/sinistre(\/|\?|$)/i, ttlMs: 10_000 },
    { pattern: /\/vehicule\/all(\?|$)/i, ttlMs: 30_000 },
    { pattern: /\/missions\/[0-9]+\/vehicule(\?|$)/i, ttlMs: 15_000 },
    { pattern: /\/sinistre\/[0-9]+\/vehicule(\?|$)/i, ttlMs: 30_000 },
    { pattern: /\/reparateurs(\/|\?|$)/i, ttlMs: 30_000 },
    { pattern: /\/assure(\/|\?|$)/i, ttlMs: 30_000 }
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Mutations: forward and invalidate related cache entries afterwards
    if (req.method !== 'GET') {
      return next.handle(req).pipe(
        finalize(() => this.evictByPrefix(this.basePrefix(req.url)))
      );
    }

    // For GET requests, respect explicit bypass via context or policy
    if (req.context.get(BYPASS_CACHE) || this.shouldBypass(req.url)) {
      return next.handle(req);
    }

    const cacheKey = this.buildCacheKey(req);
    const now = Date.now();
    const perRequestTtl = req.context.get(CACHE_TTL);
    const policyTtl = this.resolveTtl(req.url);
    const ttl = typeof perRequestTtl === 'number' && perRequestTtl > 0
      ? perRequestTtl
      : (policyTtl ?? this.defaultTtlMs);

    // Serve from cache if present and not expired
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.addedAt < cached.ttl) {
      return of(cached.response.clone());
    }

    // De-duplicate in-flight requests for the same key
    const inflight = this.inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight;
    }

    const request$ = next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Cache successful responses only
          this.cache.set(cacheKey, {
            urlWithParams: cacheKey,
            response: event.clone(),
            addedAt: Date.now(),
            ttl
          });
        }
      }),
      catchError(err => {
        // On error, do not cache. If a stale cache exists, optionally serve it.
        if (cached) {
          return of(cached.response.clone());
        }
        return throwError(() => err);
      }),
      finalize(() => {
        this.inflightRequests.delete(cacheKey);
        this.evictExpired();
      }),
      // Share the same subscription for concurrent identical requests
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.inflightRequests.set(cacheKey, request$);
    return request$;
  }

  private buildCacheKey(req: HttpRequest<any>): string {
    // Include URL and params; headers generally excluded for GET caching
    return req.urlWithParams;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.addedAt >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private resolveTtl(url: string): number | null {
    for (const policy of this.policies) {
      if (policy.pattern.test(url)) {
        return policy.ttlMs ?? null;
      }
    }
    return null;
  }

  private shouldBypass(url: string): boolean {
    return this.policies.some(p => p.bypass && p.pattern.test(url));
  }

  private basePrefix(url: string): string {
    const [clean] = url.split('?');
    const parts = clean.split('/').filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1];
      if (/^\d+$/.test(last)) {
        parts.pop();
      }
    }
    return '/' + parts.join('/');
  }

  private evictByPrefix(prefix: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

