import { TestBed } from '@angular/core/testing';

import { CasosService } from './casos.service';

describe('CasosService', () => {
  let service: CasosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CasosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
