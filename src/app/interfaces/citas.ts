export interface CitaDTO {
  citaId: number;
  fechaHora: string;
  descripcion: string;
  clienteId: number;
  nombreCliente?: string;
  apellidoCliente?: string;
  abogadoId?: number | null;
  estado: string;
  especialidad: string;
  nombreAbogado?: string;
  duracion: number;
  motivo?:string;
  especialidadId: number;
}

export interface IDuracionCita{
  label: string;
  value: number;
}
