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
  seguimientoId: number;  // ID del seguimiento
  casoId: number;         // ID del caso asociado
  usuarioId: number;      // ID del usuario que creó el seguimiento
  observacion: string;    // Observación realizada
  progreso: number;       // Porcentaje de progreso
  fechaRegistro: Date;    // Fecha del seguimiento
}
