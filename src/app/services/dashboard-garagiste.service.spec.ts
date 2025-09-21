import { TestBed } from '@angular/core/testing';

import { DashboardGaragisteService } from './dashboard-garagiste.service';

describe('DashboardGaragisteService', () => {
  let service: DashboardGaragisteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardGaragisteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
