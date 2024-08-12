import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { CasoDTO } from '../interfaces/caso';
import { CitaDTO } from '../interfaces/citas';

@Injectable({
  providedIn: 'root'
})
export class CasosService {
  private baseUrl = 'http://localhost:5277/api';

  constructor(private http: HttpClient) { }

  getCitasAceptadas(abogadoId: number): Observable<CitaDTO[]> {
    return this.http.get<CitaDTO[]>(`${this.baseUrl}/citas/abogado/${abogadoId}`);
  }

  getCitaDetails(citaId: number): Observable<CitaDTO> {
    return this.http.get<CitaDTO>(`${this.baseUrl}/citas/cita/${citaId}/detalles`);
  }

  crearCaso(caso: CasoDTO): Observable<CasoDTO> {
    return this.http.post<CasoDTO>(`${this.baseUrl}/casos`, caso);
  }

  getCasos(): Observable<CasoDTO[]> {
    return this.http.get<CasoDTO[]>(`${this.baseUrl}/casos`);
  }

  updateCaso(caso: CasoDTO): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/casos/${caso.casoId}`, caso);
  }
}
