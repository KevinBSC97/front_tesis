import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UsuarioDTO } from '../interfaces/usuario';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private baseUrl = 'https://localhost:7060/api';

  constructor(private http: HttpClient) { }

  getUsuarios(): Observable<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>(`${this.baseUrl}/usuarios`);
  }
}
