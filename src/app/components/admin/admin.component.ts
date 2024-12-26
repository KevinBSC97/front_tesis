import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { UsuarioDTO, UsuarioRegistroDTO } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  usuarios: any[] = [];
  displayModalAdmin: boolean = false;
  displayModalAbogado: boolean = false;
  displayModalCliente: boolean = false;
  displayEditModalAdmin: boolean = false;
  displayEditModalCliente: boolean = false;
  displayEditModalAbogado: boolean = false;
  showLoading: boolean = false;
  items: MenuItem[] = [];

  formAdmin!: FormGroup;
  formCliente!: FormGroup;
  formAbogado!: FormGroup;

  displayAdminModal = false;
  displayLawyerModal = false;
  displayClientModal = false;

  administradores: UsuarioDTO[] = [];
  clientes: UsuarioDTO[] = [];
  abogados: UsuarioDTO[] = [];

  totalAdministradores: number = 0;
  totalAbogados: number = 0;
  totalClientes: number = 0;

  pageNumber: number = 1;
  pageSize: number = 50;

  currentSection: string = 'inicio';

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

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService, private messageService: MessageService, private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadEspecialidades();
    this.obtenerTotales();
    this.crearFormulario();

    this.items = [
      {
          separator: true
      },
      {
          label: 'Documents',
          items: [
              {
                  label: 'New',
                  icon: 'pi pi-plus',
              },
              {
                  label: 'Search',
                  icon: 'pi pi-search',
              }
          ]
      },
      {
          label: 'Profile',
          items: [
              {
                  label: 'Settings',
                  icon: 'pi pi-cog',
              },
              {
                  label: 'Messages',
                  icon: 'pi pi-inbox',
                  badge: '2'
              },
              {
                  label: 'Logout',
                  icon: 'pi pi-sign-out',
              }
          ]
      },
      {
          separator: true
      }
  ];
  }

  crearFormulario(): void{
    this.formAdmin = this.fb.group({
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombreUsuario: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rolId: [1],
      especialidad: [1],
    });
    this.formAbogado = this.fb.group({
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombreUsuario: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rolId: [3],
      especialidadId: ['', [Validators.required]],
    });
    this.formCliente = this.fb.group({
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombreUsuario: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rolId: [2],
      especialidad: [1],
    });
  }

  exportarExcel(): void {
    // Llamada al servicio para obtener los datos de la página actual
    this.usuarioService.exportExcel(this.pageNumber, this.pageSize).subscribe(
      (response: any) => {
        if (response && response.length > 0) {
          const wb = XLSX.utils.book_new(); // Crear un nuevo libro de Excel

          // Si hay datos, crear la hoja de usuarios
          const usersSheet = XLSX.utils.json_to_sheet(response);
          XLSX.utils.book_append_sheet(wb, usersSheet, "Usuarios");

          // Exportar el archivo Excel
          XLSX.writeFile(wb, 'Usuarios.xlsx'); // Nombre del archivo Excel
        } else {
          console.error('No hay datos disponibles para exportar');
        }
      },
      (error) => {
        console.error('Error al exportar los datos:', error);
      }
    );
  }

  changeSection(section: string) {
    this.currentSection = section;
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
        this.especialidades = data.filter((especialidad) => especialidad.especialidadId !== 1)
        .map((especialidad) => ({
          label: especialidad.descripcion,
          value: especialidad.especialidadId
        }));
      },
      // next: (data) => {
      //   this.especialidades = data.map(especialidad => ({
      //     label: especialidad.descripcion,
      //     value: especialidad.especialidadId
      //   }));
      // },
      error: (error) => console.error('Error fetching especialidades:', error),
      complete: () => {
        this.showLoading = false;
      }
    });
  }

  loadUsers() {

    this.showLoading = true;
    this.authService.getUsers(1).subscribe({
      next: (data) => {
        this.administradores = data;
        this.totalAdministradores = data.length;
      },
      error: (error) => console.log('Error al cargar los adminitradores:', error),
    });

    this.authService.getUsers(2).subscribe({
      next: (data) => {
        this.clientes = data;
        this.totalClientes = data.length;
      },
      error: (error) => console.log('Error al cargar los clientes:', error),
    });

    this.authService.getUsers(3).subscribe({
      next: (data) => {
        this.abogados = data;
        this.totalAbogados = data.length;
      },
      error: (error) => console.log('Error al cargar los abogados:', error),
      complete: () => (this.showLoading = false),
    });
    // this.authService.getUsers(1).subscribe({
    //   next: (data) => {
    //     this.usuarios = data;
    //     console.log(data);
    //   },
    //   error: (error) => {
    //     console.error('Error fetching users:', error);
    //   },
    //   complete: () => {
    //     this.showLoading = false;
    //   }
    // });
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
        this.displayModalAdmin = false;
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

  registerAdmin(): void{
    if(this.formAdmin.valid){
      const newUser: UsuarioRegistroDTO = {
        ...this.formAdmin.value,
        rolId: 1,
        especialidadId: 1,
        estado: 'A'
      };
      this.sendRegisterRequest(newUser, 'Administrador');
    } else {
      this.showVlidationMessage();
    }
  }

  registerCliente() {
    if(this.formCliente.valid){
      const newUser: UsuarioRegistroDTO = {
        ...this.formCliente.value,
        rolId: 2,
        especialidadId: 1,
        estado: 'A'
      };
      this.sendRegisterRequest(newUser, 'Cliente');
    } else {
      this.showVlidationMessage();
    }
  }

  registerAbogado() {
    if(this.formAbogado.valid){
      const newUser: UsuarioRegistroDTO = {
        ...this.formAbogado.value,
        rolId: 3,
        estado: 'A'
      };
      this.sendRegisterRequest(newUser, 'Abogado');
    } else {
      this.showVlidationMessage();
    }
  }

  private sendRegisterRequest(user: UsuarioRegistroDTO, tipo: string): void{
    this.showLoading = true;
    this.authService.register(user).subscribe({
      next: () => {
        console.log(user);
        this.messageService.add({severity: 'success', summary: 'Registro Exitoso', detail: `El ${tipo} ha sido registrado correctamente.`});
        this.resetForms();
      },
      error: (error) => {
        let errorMsg = 'Error en el registro';
        if(error.error){
          errorMsg = error.error;
        }
        this.messageService.add({severity: 'error', summary: 'Error al guardar el registro', detail: errorMsg});
      },
      complete: () => {
        this.showLoading = false;
        this.loadUsers();
      }
    })
  }

  private showVlidationMessage(): void{
    this.messageService.add({severity: 'warn', summary: 'Validación fallida', detail: 'Por favor, completa todos los campos correctamente.'});
  }

  private resetForms(): void{
    this.formAdmin.reset();
    this.formCliente.reset();
    this.formAbogado.reset();
    this.displayModalAdmin = false;
    this.displayModalCliente = false;
    this.displayModalAbogado = false;
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

  editUserAdmin(usuarioId: number) {
    this.showLoading = true;
    this.authService.getUsuarioById(usuarioId).subscribe({
      next: (usuario) => {
        this.selectedUser = usuario;
        this.displayEditModalAdmin = true;
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

  editUserAbogado(usuarioId: number) {
    this.showLoading = true;
    this.authService.getUsuarioById(usuarioId).subscribe({
      next: (usuario) => {
        this.selectedUser = usuario;
        this.displayEditModalAbogado = true;
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

  editUserCliente(usuarioId: number) {
    this.showLoading = true;
    this.authService.getUsuarioById(usuarioId).subscribe({
      next: (usuario) => {
        this.selectedUser = usuario;
        this.displayEditModalCliente = true;
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

  updateUserAdmin() {
    this.showLoading = true;
    this.authService.updateUsuario(this.selectedUser.usuarioId, this.selectedUser).subscribe({
      next: () => {
        console.log('Usuario actualizado con éxito');
        this.displayEditModalAdmin = false;
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

  updateUserAbogado() {
    this.showLoading = true;
    this.authService.updateUsuario(this.selectedUser.usuarioId, this.selectedUser).subscribe({
      next: () => {
        console.log('Usuario actualizado con éxito');
        this.displayEditModalAbogado = false;
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

  updateUserCliente() {
    this.showLoading = true;
    this.authService.updateUsuario(this.selectedUser.usuarioId, this.selectedUser).subscribe({
      next: () => {
        console.log('Usuario actualizado con éxito');
        this.displayEditModalCliente = false;
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

  obtenerTotales(): void{
    this.usuarioService.getTotalesPorRol().subscribe({
      next: (data) => {
        console.log(data);
        data.forEach((item: any) => {
          switch (item.rol){
            case 'Admin':
              this.totalAdministradores = item.total;
              break;
            case 'Abogado':
              this.totalAbogados = item.total;
              break;
            case 'Cliente':
              this.totalClientes = item.total;
              break;
          }
        });
      },
      error: (error) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Error al obtener la cantidad de roles'});
      }
    })
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
