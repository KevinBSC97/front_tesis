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

  getCasosCliente(clienteId: number): Observable<CasoDTO[]>{
    return this.http.get<CasoDTO[]>(`${this.api}/casos/cliente/${clienteId}`)
  }

  updateCaso(caso: CasoDTO): Observable<void> {
    return this.http.put<void>(`${this.api}/casos/${caso.casoId}`, caso);
  }

  getTotalCasosCliente(clienteId: number): Observable<any>{
    return this.http.get<any>(`${this.api}/casos/cantidad-casos/cliente/${clienteId}`);
  }

  obtenerCasos(): Observable<CasoDTO[]>{
    return this.http.get<CasoDTO[]>(`${this.api}/casos`);
  }

  eliminarCaso(casoId: number): Observable<any>{
    return this.http.delete(`${this.api}/casos/eliminar-caso/${casoId}`)
  }

  obtieneReporte(): Observable<Blob> {
    return this.http.get(`${this.api}/casos/descargar-reporte`, {
      responseType: 'blob' // Asegura que la respuesta sea tratada como un archivo binario
    });
  }

  verificarCasoDuplicado(clienteId: number, asunto: string, citaId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.api}/casos/validar-duplicado/${clienteId}/${asunto}/${citaId}`);
  }
}
