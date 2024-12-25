import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EspecialidadDTO } from '../interfaces/usuario';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {

  constructor(private http: HttpClient) {}
  api = environment.apiUrl;

  getEspecialidades(): Observable<EspecialidadDTO[]> {
    return this.http.get<EspecialidadDTO[]>(`${this.api}/especialidades`);
  }
}
