import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclarationroulantComponent } from './declarationroulant.component';

describe('DeclarationroulantComponent', () => {
  let component: DeclarationroulantComponent;
  let fixture: ComponentFixture<DeclarationroulantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarationroulantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeclarationroulantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
