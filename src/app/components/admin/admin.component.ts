import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { EspecialidadDTO, UsuarioDTO, UsuarioRegistroDTO } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { CitasService } from 'src/app/services/citas.service';
import { CasosService } from 'src/app/services/casos.service';
import { CitaDTO } from 'src/app/interfaces/citas';
import { CasoDTO } from 'src/app/interfaces/caso';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SeguimientoService } from 'src/app/services/seguimiento.service';
import { EspecialidadService } from 'src/app/services/especialidades.service';

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
  displayModal: boolean = false;
  showLoading: boolean = false;
  displaySeguimientoModal = false;
  displayEditModalCita: boolean = false;

  items: MenuItem[] = [];
  searchText: string = '';
  searchTextAbogado: string = '';
  searchTextAdmin: string = '';
  searchTextCitas: string = '';
  searchTextCasos: string = '';
  filteredUsers: UsuarioDTO[] = [];
  filteredAbogado: UsuarioDTO[] = [];
  filteredAdmin: UsuarioDTO[] = [];
  filteredCitas: CitaDTO[] = [];
  filteredCasos: CasoDTO[] = [];

  formAdmin!: FormGroup;
  formCliente!: FormGroup;
  formAbogado!: FormGroup;
  seguimientoForm!: FormGroup;

  selectedCaso: CasoDTO | null = null;

  displayAdminModal = false;
  displayLawyerModal = false;
  displayClientModal = false;

  administradores: UsuarioDTO[] = [];
  clientes: UsuarioDTO[] = [];
  abogados: UsuarioDTO[] = [];
  citas: CitaDTO[] = [];
  casos: CasoDTO[] = [];

  listaAbogados: { label: string, value: number }[] = [];

  totalAdministradores: number = 0;
  totalAbogados: number = 0;
  totalClientes: number = 0;
  progreso = 0;

  especialidades: { label: string, value: number }[] = [];
  selectedEspecialidad: any;

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

  defaultCaso: CasoDTO = {
    casoId: 0,
    descripcion: '',
    asunto: '',
    estado: '',
    abogadoId: 0,
    clienteId: 0,
    citaId: 0,
    especialidadDescripcion: '',
    nombreCliente: '',
    fechaCita: new Date(),
    nombreAbogado: '',
    imagenes: [],
    archivos: [],
    nombreArchivo: []
  };

  selectedCasoUser: CasoDTO = this.defaultCaso;

  defaultCita: CitaDTO = {
    citaId: 0,
    fechaHora: '',
    descripcion: '',
    clienteId: 0,
    nombreCliente: '',
    apellidoCliente: '',
    abogadoId: 0,
    estado: '',
    especialidad: '',
    nombreAbogado: '',
    duracion: 0,
    motivo: '',
    especialidadId: 0
  }

  selectCitaUser: CitaDTO = this.defaultCita;

  selectedUser: UsuarioDTO = this.defaultUser;

  roles = [
    { label: 'Abogado', value: 3 },
    { label: 'Cliente', value: 2 }
  ];

  // especialidades = [
  //   { label: 'Ninguna', value: 1 },
  //   { label: 'Derecho familiar', value: 2 },
  //   { label: 'Derecho laboral', value: 3},
  //   { label: 'Derecho civil', value: 4}
  // ];

  constructor(private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private especialidadService: EspecialidadService,
    private citasService: CitasService,
    private casosService: CasosService,
    private seguimientoService: SeguimientoService,
    private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadEspecialidades();
    this.obtenerTotales();
    this.crearFormulario();
    this.loadCitas();
    this.loadCasos();
    this.seguimientoForm = this.fb.group({
      observacion: ['', Validators.required],
      progreso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

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

  // getEspecialidadDescripcion(id: number): string {
  //   const especialidad = this.especialidades.find(e => e.value === id);
  //   return especialidad ? especialidad.label : 'Especialidad desconocida';
  // }

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

  loadCitas(){
    this.showLoading = true;
    this.citasService.getCitas().subscribe({
      next: (response) => {
        console.log('citas: ', response);
        this.citas = response;
        this.filteredCitas = [...response];
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar las citas'
        })
      }
    })
  }

  loadCasos(){
    this.showLoading = true;
    this.casosService.obtenerCasos().subscribe({
      next: (response) => {
        this.casos = response;
        this.filteredCasos = [...response];
      }
    })
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

  cargarAbogadosPorEspecialidad(): void {
    if (!this.selectedEspecialidad) {
      this.abogados = [];
      return;
    }

    this.especialidadService.getAbogadosPorEspecialidad(this.selectCitaUser.especialidadId).subscribe({
      next: (response) => {
        this.listaAbogados = response.map(abogado => ({
            label: `${abogado.nombre} ${abogado.apellido}`, // Nombre completo del abogado
            value: abogado.usuarioId // ID del abogado
        }));
        console.log('Abogados cargados: ', this.listaAbogados); // Verificar datos mapeados
        },
        error: (error) => {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar los abogados'
            });
        }
    });
  }

  loadUsers() {

    this.showLoading = true;
    this.authService.getUsers(1).subscribe({
      next: (data) => {
        this.administradores = data;
        this.totalAdministradores = data.length;
        this.filteredAdmin = [...data];
      },
      error: (error) => console.log('Error al cargar los adminitradores:', error),
    });

    this.authService.getUsers(2).subscribe({
      next: (data) => {
        this.clientes = data;
        this.totalClientes = data.length;
        this.filteredUsers = [...data];
      },
      error: (error) => console.log('Error al cargar los clientes:', error),
    });

    this.authService.getUsers(3).subscribe({
      next: (data) => {
        this.abogados = data;
        this.totalAbogados = data.length;
        this.filteredAbogado = [...data];
      },
      error: (error) => console.log('Error al cargar los abogados:', error),
      complete: () => (this.showLoading = false),
    });
  }

  filterAdministradores(): void {
    if (!this.searchTextAdmin.trim()) {
      this.filteredAdmin = [...this.administradores];
      return;
    }

    const searchTextLower = this.searchTextAdmin.toLowerCase();

    this.filteredAdmin = this.administradores.filter((admin) => {
      return (
        admin.identificacion.toLowerCase().includes(searchTextLower) ||
        admin.nombreUsuario.toLowerCase().includes(searchTextLower) ||
        admin.nombre.toLowerCase().includes(searchTextLower) ||
        admin.apellido.toLowerCase().includes(searchTextLower)
      );
    });
  }

  filterAbogados(): void {
    if (!this.searchTextAbogado.trim()) {
      this.filteredAbogado = [...this.abogados];
      return;
    }

    const searchTextLower = this.searchTextAbogado.toLowerCase();

    this.filteredAbogado = this.abogados.filter((abogado) => {
      return (
        abogado.identificacion.toLowerCase().includes(searchTextLower) ||
        abogado.nombreUsuario.toLowerCase().includes(searchTextLower) ||
        abogado.nombre.toLowerCase().includes(searchTextLower) ||
        abogado.apellido.toLowerCase().includes(searchTextLower) ||
        abogado.especialidadDescripcion?.toLowerCase().includes(searchTextLower)
      );
    });
  }

  filterClientes(): void {
    if (!this.searchText.trim()) {
      this.filteredUsers = [...this.clientes];
      return;
    }

    const searchTextLower = this.searchText.toLowerCase();

    this.filteredUsers = this.clientes.filter((cliente) => {
      return (
        cliente.identificacion.toLowerCase().includes(searchTextLower) ||
        cliente.nombreUsuario.toLowerCase().includes(searchTextLower) ||
        cliente.nombre.toLowerCase().includes(searchTextLower) ||
        cliente.apellido.toLowerCase().includes(searchTextLower)
      );
    });
  }

  filterCitas(): void{
    if(!this.searchTextCitas.trim()){
      this.filteredCitas = [...this.citas];
      return;
    }

    const searchTextLower = this.searchTextCitas.toLowerCase();
    this.filteredCitas = this.citas.filter((cita) => {
      return(
        cita.descripcion.toLowerCase().includes(searchTextLower) ||
        cita.nombreAbogado?.toLowerCase().includes(searchTextLower) ||
        cita.nombreCliente?.toLowerCase().includes(searchTextLower) ||
        cita.estado.toLowerCase().includes(searchTextLower)
      );
    })
  }

  filterCasos() {
    if(!this.searchTextCasos.trim()){
      this.filteredCasos = [...this.casos];
      return;
    }

    const searchTextLower = this.searchTextCasos.toLowerCase();
    this.filteredCasos = this.casos.filter((caso) => {
      return(
        caso.asunto.toLowerCase().includes(searchTextLower) ||
        caso.nombreCliente.toLowerCase().includes(searchTextLower) ||
        caso.nombreAbogado.toLowerCase().includes(searchTextLower) ||
        caso.estado.toLowerCase().includes(searchTextLower)
      )
    })
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

  editCita(cita: CitaDTO){
    console.log('cita seleccionada: ', cita);
    this.selectCitaUser = { ...cita };
    if(cita.especialidad){
      this.selectedEspecialidad = { descripcion: cita.especialidad }
      this.cargarAbogadosPorEspecialidad();
    }
    this.displayEditModalCita = true;
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

  updateCita(){
    if (this.selectCitaUser) {
      const citaActualizada: CitaDTO = {
        citaId: this.selectCitaUser.citaId,
        fechaHora: this.selectCitaUser.fechaHora,
        descripcion: this.selectCitaUser.descripcion,
        clienteId: this.selectCitaUser.clienteId,
        nombreCliente: this.selectCitaUser.nombreCliente,
        nombreAbogado: this.selectCitaUser.nombreAbogado,
        especialidad: this.selectCitaUser.especialidad,
        abogadoId: this.selectCitaUser.abogadoId, // Enviar solo el ID del abogado
        especialidadId: this.selectedEspecialidad.especialidadId, // Enviar el ID de la especialidad seleccionada
        estado: this.selectCitaUser.estado,
        duracion: this.selectCitaUser.duracion,
        motivo: this.selectCitaUser.motivo,
      };
      this.citasService.actualizarCita(citaActualizada.citaId, citaActualizada).subscribe({
          next: () => {
              this.messageService.add({
                  severity: 'success',
                  summary: 'Cita Actualizada',
                  detail: 'La cita se actualizó correctamente',
              });
              this.displayEditModalCita = false;
              this.loadCitas(); // Recarga la lista de citas
          },
          error: (error) => {
              this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Error al actualizar la cita',
              });
              console.error('Error al actualizar la cita:', error);
          },
      });
    }
  }

  closeEditModal() {
    this.displayEditModalCita = false;
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

  showCaseDetails(caso: CasoDTO) {
    console.log('caso:', caso);
    this.selectedCaso = caso;
    this.displayModal = true;
  }

  abrirModalSeguimiento(caso: any) {
    this.selectedCasoUser = caso;
    this.progreso = caso.progreso || 0;
    this.seguimientoForm.patchValue({
      observacion: '',
      progreso: this.progreso,
    });
    this.displaySeguimientoModal = true;
  }

  guardarSeguimiento(){
    if(this.seguimientoForm.valid){
      const seguimientoData = {
        casoId: this.selectedCasoUser.casoId,
        usuarioId: this.authService.getCurrentUser()?.usuarioId,
        observacion: this.seguimientoForm.value.observacion,
        progreso: this.seguimientoForm.value.progreso
      };
      this.seguimientoService.agregarSeguimiento(seguimientoData).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Seguimiento Guardado',
            detail: 'El seguimiento fue guardado exitosamente',
          });
          this.displaySeguimientoModal = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al guardar el seguimiento',
          })
        }
      })
    }
  }

  extraerTipoArchivo(archivo: string): string {
    const match = archivo.match(/^data:(.*?);base64,/);
    return match ? match[1] : 'application/octet-stream';  // Si no se encuentra, usa un genérico
  }

  downloadPDF() {
    if (this.selectedCaso) {
        const doc = new jsPDF();
        let finalY = 30; // Posición inicial después del título

        // Título del Documento
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text('Detalles del Caso', 105, 15, { align: "center" });

        // Datos a excluir (como IDs y otros innecesarios)
        const excludedFields = ['casoId', 'abogadoId', 'clienteId', 'citaId', 'imagenes', 'archivos', 'especialidadDescripcion', 'fechaCita', 'nombreArchivo'];

        const fieldMapping: { [key: string]: string } = {
            asunto: 'Asunto',
            descripcion: 'Descripción',
            nombreCliente: 'Cliente',
            nombreAbogado: 'Abogado',
            fechaRegistro: 'Fecha del Caso',
            estado: 'Estado',
            duracion: 'Duracion',
            fechaFinalizacion: 'Fecha de finalizacion del caso',
            progreso: 'Progreso'
        };

        // Formateo y mapeo de los datos
        const data = this.selectedCaso
          ? Object.keys(this.selectedCaso)
              .filter(key => !excludedFields.includes(key))
              .map(key => [
                fieldMapping[key] || key, // Mapea el nombre del campo
                (() => {
                  const value = this.selectedCaso?.[key as keyof CasoDTO];
                  if (key === 'fechaRegistro') {
                    // Manejo específico para el campo fechaRegistro
                    if (value instanceof Date) {
                      return value.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    }
                    if (typeof value === 'string') {
                      try {
                        return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                      } catch {
                        return value; // Devuelve el valor como está si no se puede convertir
                      }
                    }
                    return ''; // Valor por defecto si no es ni Date ni string
                  }
                  // Manejo genérico para otros campos
                  if (Array.isArray(value)) {
                    return value.join(', ');
                  }
                  return value?.toString() ?? '';
                })()
              ])
          : [];

        // Generar tabla con los datos
        autoTable(doc, {
            startY: finalY,
            head: [['Campo', 'Valor']],
            body: data,
            styles: {
                fontSize: 11,
                cellPadding: 3,
                minCellHeight: 10
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 25, left: 15, right: 15 },
            didDrawPage: (data) => {
              finalY = data.cursor?.y ?? 30; // Actualizamos la posición final de la tabla
            }
        });

        // Agregar imágenes
        if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
          let imgY = finalY + 10; // Espacio después de la tabla
          this.selectedCaso.imagenes.forEach((base64Image: string) => {
            const imgWidth = 50; // Ancho de la imagen
            const imgHeight = 50; // Alto de la imagen

            // Verificar si la imagen cabe en la página actual
            if (imgY + imgHeight > doc.internal.pageSize.height) {
              doc.addPage(); // Crear nueva página
              imgY = 10; // Reiniciar posición en la nueva página
            }

            doc.addImage(base64Image, 'JPEG', 15, imgY, imgWidth, imgHeight);
            imgY += imgHeight + 10; // Incrementar posición para la siguiente imagen
          });
        }

        // Guardar el PDF con un nombre dinámico
        doc.save(`Detalles_Caso_${this.selectedCaso.casoId}.pdf`);
    }
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

  closeModal() {
    this.displayModal = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
