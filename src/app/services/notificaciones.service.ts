import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NotificacionDTO } from '../interfaces/notificacion';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNotificacionesPorUsuario(usuarioId: number): Observable<NotificacionDTO[]>{
    return this.http.get<NotificacionDTO[]>(`${this.api}/notificaciones/usuario/${usuarioId}`);
  }

  createNotificacion(notificacion: Partial<NotificacionDTO>): Observable<NotificacionDTO[]>{
    return this.http.post<NotificacionDTO[]>(`${this.api}/notificaciones`, notificacion);
  }

  marcarNotificacionComoLeida(notificacionId: number): Observable<NotificacionDTO[]>{
    return this.http.put<NotificacionDTO[]>(`${this.api}/notificaciones/marcar-leida/${notificacionId}`, null);
  }

  getRecordatoriosPendientes(usuarioId: number): Observable<NotificacionDTO[]> {
    return this.http.get<NotificacionDTO[]>(`${this.api}/citas/recordatorios/${usuarioId}`);
  }

  getRecordatoriosParaAdministradores(): Observable<NotificacionDTO[]> {
    return this.http.get<NotificacionDTO[]>(`${this.api}/citas/administrador/recordatorios`);
  }

  getRecordatorioCasosPendientes(): Observable<NotificacionDTO[]>{
    return this.http.get<NotificacionDTO[]>(`${this.api}/casos/verificar-casos`);
  }

  getNotificarProgresoCaso(): Observable<NotificacionDTO[]>{
    return this.http.get<NotificacionDTO[]>(`${this.api}/casos/verificar-progreso-casos`);
  }
}
