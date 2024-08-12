import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { UsuarioDTO, UsuarioRegistroDTO } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  usuarios: any[] = [];
  displayModal: boolean = false;
  displayEditModal: boolean = false;
  showLoading: boolean = false;
  estados = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'I' }
  ];

  newUser: UsuarioRegistroDTO = {
    identificacion: '',
    nombre: '',
    apellido: '',
    email: '',
    nombreUsuario: '',
    password: '',
    rolId: 0,
    especialidadId: 0,
    estado: 'A'
  };

  defaultUser: UsuarioDTO = {
    usuarioId: 0,
    nombre: '',
    apellido: '',
    nombreUsuario: '',
    email: '',
    rolId: 0,
    rolDescripcion: '', // Proporciona un objeto RolDTO predeterminado
    especialidadId: 0,
    especialidadDescripcion: '',
    estado: '',
    identificacion: ''
  };

  selectedUser: UsuarioDTO = this.defaultUser;

  roles = [
    { label: 'Abogado', value: 3 },
    { label: 'Cliente', value: 2 }
  ];

  especialidades = [
    { label: 'Ninguna', value: 1 },
    { label: 'Derecho familiar', value: 2 },
    { label: 'Derecho laboral', value: 3},
    { label: 'Derecho civil', value: 4}
  ];

  constructor(private authService: AuthService, private messageService: MessageService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadEspecialidades();
  }

  getEspecialidadDescripcion(id: number): string {
    const especialidad = this.especialidades.find(e => e.value === id);
    return especialidad ? especialidad.label : 'Especialidad desconocida';
  }

  canRegister(): boolean {
    // Asegura que todos los campos están completos y valida las combinaciones de rol y especialidad
    const { nombre, apellido, email, nombreUsuario, password, rolId, especialidadId } = this.newUser;
    if (!nombre || !apellido || !email || !nombreUsuario || !password || !rolId || especialidadId == null) {
      return false;  // Asegura que todos los campos están llenos
    }

    if (rolId === 2 && especialidadId !== 1) { // Cliente no puede tener especialidad que no sea 'Ninguna'
      return false;
    }

    if (rolId === 3 && especialidadId === 1) { // Abogado no puede tener 'Ninguna' especialidad
      return false;
    }

    return true; // Todos los campos son válidos
  }

  loadEspecialidades() {
    this.showLoading = true;

    this.authService.getEspecialidades().subscribe({
      next: (data) => {
        this.especialidades = data.map(especialidad => ({
          label: especialidad.descripcion,
          value: especialidad.especialidadId
        }));
      },
      error: (error) => console.error('Error fetching especialidades:', error),
      complete: () => {
        this.showLoading = false;
      }
    });
  }

  loadUsers() {

    this.showLoading = true;
    this.authService.getUsers().subscribe({
      next: (data) => {
        this.usuarios = data;
        console.log(data);
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      },
      complete: () => {
        this.showLoading = false;
      }
    });
  }

  register() {
    if (!this.canRegister()) {
      this.messageService.add({severity:'warn', summary: 'Validación fallida', detail: 'Por favor, revisa los campos. Algunos datos son inválidos.'});
      return;
    }

    this.showLoading = true;

    this.authService.register(this.newUser).subscribe({
      next: (data) => {
        console.log("Registro exitoso", data);
        this.resetNewUser();
        this.displayModal = false;
        this.loadUsers(); // Recargar lista de usuarios
        this.messageService.add({severity:'success', summary: 'Registro Exitoso', detail: 'El usuario ha sido registrado con éxito'});
      },
      error: (error) => {
        console.error("Error en el registro", error);
        // Asume que el servidor devuelve un mensaje de error en la respuesta del error
        this.messageService.add({severity:'error', summary: 'Error en el Registro', detail: error.error.message || 'Error desconocido al registrar el usuario'});
      },
      complete: ()=>{
        this.showLoading = false;
      }
    });
  }

  // register() {
  //   if (!this.canRegister()) {
  //     this.messageService.add({severity:'warn', summary: 'Validación fallida', detail: 'Por favor, revisa los campos. Algunos datos son inválidos.'});
  //     return;
  //   }
  //   const user: UsuarioRegistroDTO = {
  //     identificacion: this.newUser.identificacion,
  //     nombre: this.newUser.nombre,
  //     apellido: this.newUser.apellido,
  //     email: this.newUser.email,
  //     nombreUsuario: this.newUser.nombreUsuario,
  //     password: this.newUser.password,
  //     rolId: this.newUser.rolId,
  //     especialidadId: this.newUser.especialidadId,
  //     estado: this.newUser.estado
  //   };
  //   this.authService.register(user).subscribe({
  //     next: (data) => {
  //       console.log("Registro exitoso", data);
  //       this.resetNewUser();
  //       this.displayModal = false;
  //       this.loadUsers(); // Recargar lista de usuarios
  //       this.messageService.add({severity:'success', summary: 'Registro Exitoso', detail: 'El usuario ha sido registrado con éxito'});
  //     },
  //     error: (error) => {
  //       console.error("Error en el registro", error);
  //       this.messageService.add({severity:'error', summary: 'Error en el Registro', detail: 'Error al registrar el usuario'});
  //     }
  //   });
  // }

  resetNewUser() {
    this.newUser = {
        identificacion: '',
        nombre: '',
        apellido: '',
        email: '',
        nombreUsuario: '',
        password: '',
        rolId: 0,
        especialidadId: 0,
        estado: 'A'
    };
  }

  editUser(usuarioId: number) {
    this.showLoading = true;
    this.authService.getUsuarioById(usuarioId).subscribe({
      next: (usuario) => {
        this.selectedUser = usuario;
        this.displayEditModal = true;
      },
      error: (error) => {
        console.error('Error al cargar el usuario:', error);
        this.selectedUser = this.defaultUser; // Usar defaultUser en lugar de null
      },
      complete: ()=>{
        this.showLoading = false;
      }
    });
  }

  updateUser() {
    this.showLoading = true;
    this.authService.updateUsuario(this.selectedUser.usuarioId, this.selectedUser).subscribe({
      next: () => {
        console.log('Usuario actualizado con éxito');
        this.displayEditModal = false;
        this.loadUsers(); // Recargar los usuarios actualizados
        this.messageService.add({severity:'success', summary: 'Éxito', detail: 'El usuario ha sido actualizado con éxito'});
      },
      error: (error) => {
        console.error('Error al actualizar el usuario:', error);
        this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al actualizar el usuario'});
      },
      complete: () => {
        this.showLoading = false;
      }
    });
  }

  getRoleDescription(rolId: number): string {
    const role = this.roles.find(r => r.value === rolId);
    return role ? role.label : 'Rol desconocido';
  }

  validateNumber(event: KeyboardEvent): void {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }
}
