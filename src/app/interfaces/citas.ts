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
}