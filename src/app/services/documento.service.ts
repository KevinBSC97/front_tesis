import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environment/environment";
import { DocumentoDTO } from "../interfaces/documentos";

@Injectable({
  providedIn: 'root'
})

export class DocumentoService{
  api = environment.apiUrl;
  constructor(private http: HttpClient){}

  agregarDocumento(documento: any): Observable<any>{
    return this.http.post(`${this.api}/documentos/crear-documento`, documento);
  }

  getDocumentos(): Observable<any[]>{
    return this.http.get<any[]>(`${this.api}/documentos`);
  }

  updateDocumento(documentoId: number, documento: DocumentoDTO): Observable<DocumentoDTO[]>{
    return this.http.put<DocumentoDTO[]>(`${this.api}/documentos/actualizar-documento/${documentoId}`, documento)
  }
}
