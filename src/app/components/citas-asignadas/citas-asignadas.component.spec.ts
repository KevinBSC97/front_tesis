import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitasAsignadasComponent } from './citas-asignadas.component';

describe('CitasAsignadasComponent', () => {
  let component: CitasAsignadasComponent;
  let fixture: ComponentFixture<CitasAsignadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CitasAsignadasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitasAsignadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
