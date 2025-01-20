import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CitaDTO } from '../interfaces/citas';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  //private api = 'http://localhost:5277/api';
  api = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getCitasAsignadas(abogadoId: number): Observable<CitaDTO[]> {
    console.log(this.api);
    return this.http.get<CitaDTO[]>(`${this.api}/citas/abogado/${abogadoId}`);
  }

  getCitaDetails(citaId: number): Observable<CitaDTO> {
    return this.http.get<CitaDTO>(`${this.api}/citas/cita/${citaId}/detalles`);
  }

  updateCita(cita: CitaDTO): Observable<CitaDTO> {
    return this.http.put<CitaDTO>(`${this.api}/citas/${cita.citaId}`, cita).pipe(
        catchError(error => {
            console.error('Error al actualizar la cita:', error);
            return throwError(() => new Error('Error al actualizar la cita'));
        })
    );
  }

  getCitasClientes(clienteId: number): Observable<CitaDTO[]>{
    return this.http.get<CitaDTO[]>(`${this.api}/citas/cliente/${clienteId}`)
  }

  getTotalCitasAbogado(abogadoId: number): Observable<any>{
    return this.http.get<any>(`${this.api}/citas/cantidad-citas/abogado/${abogadoId}`)
  }

  getTotalCitasCliente(clienteId: number): Observable<any>{
    return this.http.get<any>(`${this.api}/citas/cantidad-citas/cliente/${clienteId}`)
  }

  getCitasPorEstado(abogadoId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/citas/estado/${abogadoId}`);
  }

  getCitas(): Observable<CitaDTO[]>{
    return this.http.get<CitaDTO[]>(`${this.api}/citas`);
  }

  actualizarCita(citaId: number, cita: CitaDTO): Observable<CitaDTO[]>{
    return this.http.put<CitaDTO[]>(`${this.api}/citas/editar-cita/${citaId}`, cita);
  }
}
