import { Injectable } from '@angular/core';
import { environment } from 'src/environment/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { EspecialidadDTO, LoginDTO, ResponseDTO, UsuarioDTO, UsuarioRegistroDTO } from '../interfaces/usuario';
import { CitaDTO } from '../interfaces/citas';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5277/api';

  private currentUserSubject: BehaviorSubject<UsuarioDTO | null>;

  public currentUser: Observable<UsuarioDTO | null>;

  constructor(private http: HttpClient) {
    // Inicializa currentUserSubject con el valor almacenado o null si no hay nada almacenado
    const storedUser = localStorage.getItem('currentUser');
    const user = storedUser ? JSON.parse(storedUser) : null;
    this.currentUserSubject = new BehaviorSubject<UsuarioDTO | null>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  login(credentials: { NombreUsuario: string, Contraseña: string }): Observable<any> {
    return this.http.post<ResponseDTO>(`${this.baseUrl}/usuarios/login`, credentials, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      map(response => {
        // Procesar la respuesta aquí
        this.setSession(response);
        return response;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => new Error('Error de autenticación'));
      })
    );
  }

  setSession(authResult: ResponseDTO): void {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('currentUser', JSON.stringify(authResult.usuario));
    localStorage.setItem('rolDescripcion', authResult.usuario.rolDescripcion);  // Asegúrate de guardar el rol aquí
    this.currentUserSubject.next(authResult.usuario);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rolDescripcion');
    this.currentUserSubject.next(null);
    // Redireccionar a login u otra página inicial
  }

  public isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }

  getUsers(rolId?: number): Observable<UsuarioDTO[]>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({'Authorization': `Bearer ${token}`});
    let params = new HttpParams();
    if(rolId !== undefined){
      params = params.set('rolId', rolId.toString());
    }
    return this.http.get<UsuarioDTO[]>(`${this.baseUrl}/usuarios`, {headers, params});
  }

  register(user: UsuarioRegistroDTO): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/usuarios/registro`, user, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  createCita(cita: CitaDTO): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({'Authorization': `Bearer ${token}`});
    return this.http.post(`${this.baseUrl}/citas`, cita, { headers });
  }

  getCurrentUser(): UsuarioDTO | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  getAbogados(): Observable<UsuarioDTO[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<UsuarioDTO[]>(`${this.baseUrl}/usuarios/abogados`, { headers });
  }

  getEspecialidadesAbogados(): Observable<EspecialidadDTO[]> {
    return this.http.get<EspecialidadDTO[]>(`${this.baseUrl}/especialidades`);
  }

  getEspecialidades(): Observable<EspecialidadDTO[]> {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });
    return this.http.get<EspecialidadDTO[]>(`${this.baseUrl}/especialidades`, { headers });
  }

  getAbogadosByEspecialidad(especialidadId: number): Observable<UsuarioDTO[]> {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });
    return this.http.get<UsuarioDTO[]>(`${this.baseUrl}/especialidades/${especialidadId}/abogados`, { headers });
  }

  getLoggedUserId(): number | null {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.usuarioId : null;
  }

  getUsuarioById(id: number): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${this.baseUrl}/usuarios/${id}`);
  }

  updateUsuario(id: number, usuario: UsuarioDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/${id}`, usuario);
  }
}
