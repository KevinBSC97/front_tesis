import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CitaDTO } from '../interfaces/citas';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private baseUrl = 'http://localhost:5277/api';

  constructor(private http: HttpClient) { }

  getCitasAsignadas(abogadoId: number): Observable<CitaDTO[]> {
    return this.http.get<CitaDTO[]>(`${this.baseUrl}/citas/abogado/${abogadoId}`);
  }

  getCitaDetails(citaId: number): Observable<CitaDTO> {
    return this.http.get<CitaDTO>(`${this.baseUrl}/citas/cita/${citaId}/detalles`);
  }

  updateCita(cita: CitaDTO): Observable<CitaDTO> {
    return this.http.put<CitaDTO>(`${this.baseUrl}/citas/${cita.citaId}`, cita).pipe(
        catchError(error => {
            console.error('Error al actualizar la cita:', error);
            return throwError(() => new Error('Error al actualizar la cita'));
        })
    );
  }
}
