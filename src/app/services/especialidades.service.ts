import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EspecialidadDTO } from '../interfaces/usuario';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {

  constructor(private http: HttpClient) {}

  getEspecialidades(): Observable<EspecialidadDTO[]> {
    return this.http.get<EspecialidadDTO[]>('https://localhost:7060/api/especialidades');
  }
}
