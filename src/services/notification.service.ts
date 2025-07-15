import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    read: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationsSubject = new BehaviorSubject<Notification[]>([
        {
            id: '1',
            message: 'Nouveau sinistre déclaré',
            type: 'info',
            timestamp: new Date(),
            read: false
        },
        {
            id: '2',
            message: 'Document signé avec succès',
            type: 'success',
            timestamp: new Date(),
            read: false
        },
        {
            id: '3',
            message: 'Rappel: Vérification véhicule',
            type: 'warning',
            timestamp: new Date(),
            read: false
        }
    ]);

    notifications$ = this.notificationsSubject.asObservable();

    constructor(private http: HttpClient) {}

    getUnreadCount(): number {
        return this.notificationsSubject.value.filter(n => !n.read).length;
    }

    markAsRead(id: string) {
        const notifications = this.notificationsSubject.value.map(n =>
            n.id === id ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(notifications);
    }

    addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
        const notifications = this.notificationsSubject.value;
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date()
        };
        this.notificationsSubject.next([newNotification, ...notifications]);
    }

    getUserNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>('https://sosmongarage-production.up.railway.app/V1/api/notifications');
    }
}
