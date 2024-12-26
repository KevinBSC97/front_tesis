import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { CasoDTO } from '../interfaces/caso';
import { CitaDTO } from '../interfaces/citas';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class CasosService {
  //private api = 'http://localhost:5277/api';
  api = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getCitasAceptadas(abogadoId: number): Observable<CitaDTO[]> {
    return this.http.get<CitaDTO[]>(`${this.api}/citas/abogado/${abogadoId}`);
  }

  getCitaDetails(citaId: number): Observable<CitaDTO> {
    return this.http.get<CitaDTO>(`${this.api}/citas/cita/${citaId}/detalles`);
  }

  crearCaso(caso: CasoDTO): Observable<CasoDTO> {
    return this.http.post<CasoDTO>(`${this.api}/casos`, caso);
  }

  getCasos(abogadoId: number): Observable<CasoDTO[]> {
    return this.http.get<CasoDTO[]>(`${this.api}/casos/abogado/${abogadoId}`);
  }

  updateCaso(caso: CasoDTO): Observable<void> {
    return this.http.put<void>(`${this.api}/casos/${caso.casoId}`, caso);
  }
}
