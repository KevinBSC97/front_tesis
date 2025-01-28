import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environment/environment";

@Injectable({
  providedIn: 'root'
})

export class SeguimientoService{
  api = environment.apiUrl;
  constructor(private http: HttpClient){}

  agregarSeguimiento(seguimiento: any): Observable<any>{
    return this.http.post(`${this.api}/seguimientos/crear-seguimiento`, seguimiento);
  }

  getSeguimientosPorCaso(casoId: number): Observable<any[]>{
    return this.http.get<any[]>(`${this.api}/seguimientos/caso/${casoId}`);
  }

  notificarRetraso(casoId: number, mensaje: string): Observable<any>{
    return this.http.post(`${this.api}/casos/notificar-retraso/${casoId}`, JSON.stringify(mensaje), { headers: { 'Content-Type': 'application/json'}})
  }
}
