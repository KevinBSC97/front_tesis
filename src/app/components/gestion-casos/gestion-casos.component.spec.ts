import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionCasosComponent } from './gestion-casos.component';

describe('GestionCasosComponent', () => {
  let component: GestionCasosComponent;
  let fixture: ComponentFixture<GestionCasosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionCasosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionCasosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
