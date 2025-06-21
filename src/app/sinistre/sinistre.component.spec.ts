import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinistreComponent } from './sinistre.component';

describe('SinistreComponent', () => {
  let component: SinistreComponent;
  let fixture: ComponentFixture<SinistreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SinistreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SinistreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
