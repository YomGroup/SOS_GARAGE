import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspaceclientComponent } from './espaceclient.component';

describe('EspaceclientComponent', () => {
  let component: EspaceclientComponent;
  let fixture: ComponentFixture<EspaceclientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaceclientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspaceclientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
