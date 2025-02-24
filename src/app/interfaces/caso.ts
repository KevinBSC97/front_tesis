export interface CasoDTO{
  casoId?: number;
  descripcion: string;
  asunto: string;
  estado: string;
  abogadoId: number;
  clienteId: number;
  citaId: number;
  especialidadDescripcion: string;
  nombreCliente: string;
  fechaCita: Date;
  nombreAbogado: string;
  imagenes: string[];
  fechaRegistro?: Date;
  archivos: string[];
  nombreArchivo: string[];
  duracion?: number;
  fechaFinalizacion?: Date;
  progreso?: number;
  tipoCaso?: string;
  seguimientos?: SeguimientoDTO[]
}

export interface SeguimientoDTO {
  seguimientoId: number;
  casoId: number;
  usuarioId: number;
  observacion: string;
  progreso: number;
  fechaRegistro: Date;
}
