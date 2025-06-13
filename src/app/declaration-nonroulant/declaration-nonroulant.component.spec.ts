import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclarationNonroulantComponent } from './declaration-nonroulant.component';

describe('DeclarationNonroulantComponent', () => {
  let component: DeclarationNonroulantComponent;
  let fixture: ComponentFixture<DeclarationNonroulantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarationNonroulantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeclarationNonroulantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
