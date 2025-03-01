import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UsuarioDTO } from '../interfaces/usuario';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  //private api = 'http://localhost:5277/api';
  api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUsuarios(): Observable<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>(`${this.api}/usuarios`);
  }

  getTotalesPorRol(): Observable<any>{
    return this.http.get<any>(`${this.api}/usuarios/totales-roles`);
  }

  exportExcel(pageNumber: number, pageSize: number): Observable<any> {
    return this.http.get(`${this.api}/usuarios/export-excel?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
      responseType: 'json'
    });
  }

  recuperarPassword(email: string): Observable<any>{
    return this.http.post(`${this.api}/citas/reset-password`, {email});
  }

  eliminarUsuario(usuarioId: number): Observable<any>{
    return this.http.delete(`${this.api}/usuarios/eliminar/${usuarioId}`)
  }

  desactivarUsuario(usuarioId: Number): Observable<any>{
    return this.http.put(`${this.api}/usuarios/desactivar/${usuarioId}`, {});
  }
}
