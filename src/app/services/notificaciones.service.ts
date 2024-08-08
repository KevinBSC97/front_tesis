import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NotificacionDTO } from '../interfaces/notificacion';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private baseUrl = 'http://localhost:7060/api';

  constructor(private http: HttpClient) {}
}
