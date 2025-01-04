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
}
