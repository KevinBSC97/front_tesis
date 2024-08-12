export interface CitaDTO {
  citaId: number;
  fechaHora: Date;
  descripcion: string;
  clienteId: number;
  nombreCliente?: string;
  apellidoCliente?: string;
  abogadoId?: number;
  estado: string;
  especialidad: string;
  nombreAbogado: string;
  duracion: number;
}

export interface IDuracionCita{
  label: string;
  value: number;
}