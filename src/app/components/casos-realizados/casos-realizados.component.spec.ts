import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasosRealizadosComponent } from './casos-realizados.component';

describe('CasosRealizadosComponent', () => {
  let component: CasosRealizadosComponent;
  let fixture: ComponentFixture<CasosRealizadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CasosRealizadosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CasosRealizadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
