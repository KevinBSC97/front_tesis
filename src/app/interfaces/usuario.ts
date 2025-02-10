export interface LoginDTO {
  nombreUsuario: string;
  password: string;
}

export interface ResponseDTO {
  usuario: UsuarioDTO;
  token: string;
}

export interface UsuarioDTO {
  usuarioId: number;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  email: string;
  rolId: number;
  rolDescripcion: string;  // Asegúrate de agregar esta propiedad si el rol se retorna en la respuesta
  especialidadId?: number;
  especialidadDescripcion?: string;
  estado: string;
  identificacion: string;
}

export interface RolDTO {
  rolId: number;
  descripcion: string;
}

export interface UsuarioRegistroDTO {
  identificacion: string;
  nombre: string;
  apellido: string;
  email: string;
  nombreUsuario: string;
  password: string;
  rolId: number;
  especialidadId: number;
  especialidadIds?: number[];
  estado: string;
}

export interface EspecialidadDTO {
  especialidadId: number;
  descripcion: string;
}
