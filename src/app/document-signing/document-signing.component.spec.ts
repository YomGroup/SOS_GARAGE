import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentSigningComponent } from './document-signing.component';

describe('DocumentSigningComponent', () => {
  let component: DocumentSigningComponent;
  let fixture: ComponentFixture<DocumentSigningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentSigningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentSigningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
