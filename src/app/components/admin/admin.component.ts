import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { EspecialidadDTO, UsuarioDTO, UsuarioRegistroDTO } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { CitasService } from 'src/app/services/citas.service';
import { CasosService } from 'src/app/services/casos.service';
import { CitaDTO } from 'src/app/interfaces/citas';
import { CasoDTO, SeguimientoDTO } from 'src/app/interfaces/caso';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SeguimientoService } from 'src/app/services/seguimiento.service';
import { EspecialidadService } from 'src/app/services/especialidades.service';
import { DocumentoService } from 'src/app/services/documento.service';
import { DocumentoDTO } from 'src/app/interfaces/documentos';

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
  displayModalDocumento: boolean = false;
  displayEditModalDocumento: boolean = false;
  displaySeguimientosModal: boolean = false;

  items: MenuItem[] = [];
  searchText: string = '';
  searchTextAbogado: string = '';
  searchTextAdmin: string = '';
  searchTextCitas: string = '';
  searchTextCasos: string = '';
  searchTextDocumentos: string = '';
  filteredUsers: UsuarioDTO[] = [];
  filteredAbogado: UsuarioDTO[] = [];
  filteredAdmin: UsuarioDTO[] = [];
  filteredCitas: CitaDTO[] = [];
  filteredCasos: CasoDTO[] = [];
  filteredDocumentos: DocumentoDTO[] = [];

  formAdmin!: FormGroup;
  formCliente!: FormGroup;
  formAbogado!: FormGroup;
  seguimientoForm!: FormGroup;

  documentos: DocumentoDTO[] = [];
  seguimientos: SeguimientoDTO[] = [];
  transformedArchivo: { name: string; type: string; content: string }[] = []

  selectedCaso: CasoDTO | null = null;
  selectedDocumento: DocumentoDTO = {
    contenido: '',
    documentoId: 0,
    fechaCreacion: new Date(),
    nombre: '',
    nombreArchivo: '',
    tipo: '',
    usuarioId: 0,
  };

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
  totalCasos: number = 0;
  totalCitas: number = 0;
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
    especialidadIds: [],
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

  mensajeErrorIdentificacionAdmin: string = '';
  mensajeErrorIdentificacionAbogado: string = '';
  mensajeErrorIdentificacionCliente: string = '';

  currentUserId: number | null = null;

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
    private documentosService: DocumentoService,
    private seguimientoService: SeguimientoService,
    private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUser()?.usuarioId ?? null;
    this.loadUsers();
    this.loadEspecialidades();
    this.obtenerTotales();
    this.crearFormulario();
    this.loadCitas();
    this.loadCasos();
    this.loadDocumentos();
    this.seguimientoForm = this.fb.group({
      observacion: ['', Validators.required],
      progreso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
    this.suscribirValidacionIdentificacion();

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

  // crearFormulario(rolId: number, especialidadId: number = 1): FormGroup {
  //   return this.fb.group({
  //     identificacion: ['', [Validators.required, Validators.pattern(/^\d{10}$/), this.validarCedulaEcuatoriana]],
  //     nombreUsuario: ['', [Validators.required]],
  //     nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
  //     apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
  //     email: ['', [Validators.required, Validators.email]],
  //     password: ['', [Validators.required]],
  //     rolId: [rolId],
  //     especialidadId: [especialidadId, rolId === 3 ? [Validators.required] : []] // Solo se valida para "Abogado".
  //   });
  // }

  // crearFormularios(): void {
  //   this.formAdmin = this.crearFormulario(1); // Rol Administrador
  //   this.formAbogado = this.crearFormulario(3); // Rol Abogado
  //   this.formCliente = this.crearFormulario(2); // Rol Cliente
  // }

  crearFormulario(): void{
    this.formAdmin = this.fb.group({
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombreUsuario: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rolId: [1],
      especialidad: [1],
    });
    this.formAbogado = this.fb.group({
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombreUsuario: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rolId: [3],
      especialidadIds: [[], [Validators.required]],
    });
    this.formCliente = this.fb.group({
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombreUsuario: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rolId: [2],
      especialidad: [1],
    });
  }

  permitirSoloNumeros(event: KeyboardEvent): void {
    const teclaPresionada = event.key;

    // Permitir teclas de control como Backspace, Delete, Tab, Escape, Flechas, etc.
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
      ].includes(teclaPresionada)
    ) {
      return;
    }

    // Permitir solo números (0-9)
    if (!/^\d$/.test(teclaPresionada)) {
      event.preventDefault();
    }
  }

  permitirSoloLetras(event: KeyboardEvent): void {
    const charCode = event.charCode || event.keyCode;
    const charStr = String.fromCharCode(charCode);

    // Verifica que el carácter sea una letra (incluye caracteres acentuados y espacio)
    const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!regex.test(charStr)) {
      event.preventDefault();
    }
  }

  cerrarDialogoAdmin(): void {
    this.displayModalAdmin = false;
    this.formAdmin.reset(); // Resetea el formulario
    this.mensajeErrorIdentificacionAdmin = ''; // Limpia los mensajes de error personalizados
  }

  cerrarDialogoCliente(): void {
    this.displayModalAdmin = false;
    this.formCliente.reset(); // Resetea el formulario
    this.mensajeErrorIdentificacionCliente = ''; // Limpia los mensajes de error personalizados
  }

  cerrarDialogoAdbogado(): void {
    this.displayModalAbogado = false;
    this.formAbogado.reset(); // Resetea el formulario
    this.mensajeErrorIdentificacionAbogado = ''; // Limpia los mensajes de error personalizados
  }

  validarCedulaEcuatoriana(cedula: string): boolean {
    if (!cedula || cedula.length !== 10) {
      return false;
    }

    // Verificar que los dos primeros dígitos correspondan a provincias válidas
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) {
      return false;
    }

    // Verificar el dígito verificador
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula[i], 10) * coeficientes[i];
      if (valor > 9) {
        valor -= 9;
      }
      suma += valor;
    }

    const digitoVerificador = (10 - (suma % 10)) % 10;
    return digitoVerificador === parseInt(cedula[9], 10);
  }

  // validarCedulaEcuatoriana(control: AbstractControl): { [key: string]: boolean } | null {
  //   const cedula = control.value;
  //   if (!cedula) return null;

  //   // Validar longitud (10 dígitos)
  //   if (cedula.length !== 10) return { cedulaInvalida: true };

  //   // Extraer los primeros dos dígitos (provincia)
  //   const provincia = parseInt(cedula.substring(0, 2), 10);
  //   if (provincia < 1 || provincia > 24) return { cedulaInvalida: true };

  //   // El tercer dígito debe estar entre 0 y 6
  //   const tercerDigito = parseInt(cedula[2], 10);
  //   if (tercerDigito < 0 || tercerDigito > 6) return { cedulaInvalida: true };

  //   // Validar el dígito verificador con el algoritmo de módulo 10
  //   let suma = 0;
  //   const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  //   for (let i = 0; i < 9; i++) {
  //     let valor = parseInt(cedula[i], 10) * coeficientes[i];
  //     if (valor > 9) valor -= 9;
  //     suma += valor;
  //   }

  //   const digitoVerificador = (10 - (suma % 10)) % 10;
  //   if (digitoVerificador !== parseInt(cedula[9], 10)) return { cedulaInvalida: true };

  //   return null; // La cédula es válida
  // }

  suscribirValidacionIdentificacion(): void {
    this.formAdmin.get('identificacion')?.valueChanges.subscribe((valor: string) => {
      if (!valor) {
        this.mensajeErrorIdentificacionAdmin = 'El campo es obligatorio.';
      } else if (!/^\d+$/.test(valor)) {
        this.mensajeErrorIdentificacionAdmin = 'Solo se permiten números.';
      } else if (valor.length < 10) {
        this.mensajeErrorIdentificacionAdmin = 'La identificación debe tener 10 dígitos.';
      } else if (!this.validarCedulaEcuatoriana(valor)) {
        this.mensajeErrorIdentificacionAdmin = 'El número ingresado no corresponde a una cédula ecuatoriana válida.';
      } else {
        this.mensajeErrorIdentificacionAdmin = ''; // No hay errores
      }
    });

    // Repite el mismo patrón para los otros formularios
    this.formCliente.get('identificacion')?.valueChanges.subscribe((valor: string) => {
      if (!valor) {
        this.mensajeErrorIdentificacionCliente = 'El campo es obligatorio.';
      } else if (!/^\d+$/.test(valor)) {
        this.mensajeErrorIdentificacionCliente = 'Solo se permiten números.';
      } else if (valor.length < 10) {
        this.mensajeErrorIdentificacionCliente = 'La identificación debe tener 10 dígitos.';
      } else if (!this.validarCedulaEcuatoriana(valor)) {
        this.mensajeErrorIdentificacionCliente = 'El número ingresado no corresponde a una cédula ecuatoriana válida.';
      } else {
        this.mensajeErrorIdentificacionCliente = ''; // No hay errores
      }
    });

    this.formAbogado.get('identificacion')?.valueChanges.subscribe((valor: string) => {
      if (!valor) {
        this.mensajeErrorIdentificacionAbogado = 'El campo es obligatorio.';
      } else if (!/^\d+$/.test(valor)) {
        this.mensajeErrorIdentificacionAbogado = 'Solo se permiten números.';
      } else if (valor.length < 10) {
        this.mensajeErrorIdentificacionAbogado = 'La identificación debe tener 10 dígitos.';
      } else if (!this.validarCedulaEcuatoriana(valor)) {
        this.mensajeErrorIdentificacionAbogado = 'El número ingresado no corresponde a una cédula ecuatoriana válida.';
      } else {
        this.mensajeErrorIdentificacionAbogado = ''; // No hay errores
      }
    });
  }

  obtenerMensajeError(control: any): string {
    if (control?.hasError('required')) {
      return 'El campo es obligatorio.';
    }
    if (control?.hasError('pattern')) {
      return 'La identificación debe ser numérica y tener 10 dígitos.';
    }
    return '';
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

  descargarReporte(){
    this.casosService.obtieneReporte().subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ReporteCompleto.xlsx'; // Nombre del archivo
        a.click();
        window.URL.revokeObjectURL(url); // Libera la memoria asignada al objeto URL
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'El reporte se descargó correctamente'
        });
      },
      error: (err) => {
        console.error('Error al descargar el reporte:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar el reporte'
        });
      }
    });
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
    const { nombre, apellido, email, nombreUsuario, password, rolId, especialidadIds } = this.newUser;
    if (!nombre || !apellido || !email || !nombreUsuario || !password || !rolId || especialidadIds == null) {
      return false;  // Asegura que todos los campos están llenos
    }

    if (rolId === 2 && especialidadIds.length !== 1) { // Cliente no puede tener especialidad que no sea 'Ninguna'
      return false;
    }

    if (rolId === 3 && especialidadIds.includes(1)) { // Abogado no puede tener 'Ninguna' especialidad
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
        this.totalCitas = response.length;
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
        //this.casos = response;
        this.casos = response.map(caso => ({
          ...caso,
          seguimientos: caso.seguimientos || [] // Asegúrate de inicializar seguimientos como array si es null o undefined
        }));
        this.totalCasos = response.length;
        this.filteredCasos = [...response];
      }
    })
  }

  loadDocumentos(){
    this.documentosService.getDocumentos().subscribe({
      next: (data) => {
        console.log('docs: ', data);
        this.documentos = data;
        this.filteredDocumentos = [...data];
      },
      error: (error) => {
        console.log('error');
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

  showSeguimientos(caso: CasoDTO): void {
    if (caso.seguimientos && caso.seguimientos.length > 0) {
      this.seguimientos = caso.seguimientos;
      this.displaySeguimientosModal = true; // Variable para mostrar el modal
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin Seguimientos',
        detail: 'Este caso no tiene seguimientos registrados.',
      });
    }
  }

  cargarAbogadosPorEspecialidad(): void {
    if (!this.selectedEspecialidad?.especialidadId) {
      this.listaAbogados = []; // Limpia la lista si no hay especialidad seleccionada
      return;
    }

    // Llama al servicio para cargar abogados según la especialidad
    this.especialidadService.getAbogadosPorEspecialidad(this.selectedEspecialidad.especialidadId).subscribe({
      next: (response) => {
        const abogadosActivos = response.filter((abogado) => abogado.estado === 'A');
        this.listaAbogados = abogadosActivos.map((abogado) => ({
          label: `${abogado.nombre} ${abogado.apellido}`, // Nombre completo
          value: abogado.usuarioId, // ID único
        }));

        // Si no hay abogados disponibles
        if (this.listaAbogados.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Sin abogados',
            detail: 'No hay abogados disponibles para esta especialidad.',
          });
        }

        console.log('Abogados cargados:', this.listaAbogados); // Debugging
      },
      error: (error) => {
        this.listaAbogados = []; // Limpia la lista si hay un error
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los abogados.',
        });
        console.error('Error al cargar abogados:', error);
      },
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

  filterDocumentos(){
    if(!this.searchTextDocumentos.trim()){
      this.filteredDocumentos = [...this.documentos];
      return;
    }
    const searchTextLower = this.searchTextDocumentos.toLowerCase();
    this.filteredDocumentos = this.documentos.filter((documento) => {
      return(
        documento.nombre.toLowerCase().includes(searchTextLower) ||
        documento.tipo.toLowerCase().includes(searchTextLower)
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
        estado: 'A',
        especialidadIds: this.formAbogado.value.especialidadIds
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
    if(cita.estado !== 'Rechazado'){
      this.messageService.add({
        severity:'warn',
        summary:'No permitido',
        detail:'Solo se pueden editar citas que han sido rechazadas'
      });
      return;
    }
    this.selectCitaUser = { ...cita };
    this.selectCitaUser.abogadoId = null;
    if (cita.especialidadId) {
      this.selectedEspecialidad = { especialidadId: cita.especialidadId, descripcion: cita.especialidad };
      this.cargarAbogadosPorEspecialidad();
    } else {
      this.listaAbogados = []; // Limpia la lista si no hay especialidad
    }
    this.displayEditModalCita = true;
  }

  eliminarUsuario(usuarioId: number){
    if(confirm('¿Está seguro de que desea eliminar este usuario?')){
      this.usuarioService.eliminarUsuario(usuarioId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Usuario eliminado',
            detail: 'El usuario fue eliminado correctamente'
          });
          this.loadUsers();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el usuario',
          })
        }
      })
    }
  }

  eliminarCita(citaId: number){
    if(confirm('¿Está seguro de que desea eliminar esta cita?')){
      this.citasService.eliminarCita(citaId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Cita eliminada',
            detail: 'La cita fue eliminada correctamente'
          });
          this.loadCitas();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la cita'
          })
        }
      })
    }
  }

  eliminarCaso(casoId: number){
    if(confirm('¿Está seguro de que desea eliminar este caso?')){
      this.casosService.eliminarCaso(casoId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Caso eliminado',
            detail: 'El caso fue eliminado correctamente'
          });
          this.loadCasos();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el caso'
          })
        }
      })
    }
  }

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
        especialidadIds: [],
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

  updateCita() {
    if (this.selectCitaUser) {
      console.log(this.selectCitaUser);
      const citaActualizada: CitaDTO = {
        citaId: this.selectCitaUser.citaId,
        fechaHora: this.selectCitaUser.fechaHora,
        descripcion: this.selectCitaUser.descripcion,
        clienteId: this.selectCitaUser.clienteId,
        nombreCliente: this.selectCitaUser.nombreCliente,
        nombreAbogado: this.selectCitaUser.nombreAbogado,
        especialidad: this.selectCitaUser.especialidad,
        abogadoId: Number(this.selectCitaUser.abogadoId), // Asegúrate de convertirlo a número
        especialidadId: this.selectedEspecialidad?.especialidadId || 0, // ID de especialidad
        estado: this.selectCitaUser.estado,
        duracion: this.selectCitaUser.duracion || 60, // Valor predeterminado si falta
        motivo: this.selectCitaUser.motivo || '', // Valor predeterminado si falta
      };

      console.log('Datos enviados al backend:', citaActualizada);

      this.citasService.actualizarCita(citaActualizada.citaId, citaActualizada).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Cita Actualizada',
            detail: 'La cita se actualizó correctamente.',
          });
          this.displayEditModalCita = false;
          this.loadCitas(); // Recarga la lista de citas
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar la cita.',
          });
          console.error('Error al actualizar la cita:', error);
        },
      });
    }
  }

  editDocumento(documento: any): void {
    if (!documento) return; // Si el documento es null o undefined, salir del método

    this.selectedDocumento = { ...documento };

    // Transforma el archivo actual para `shared-upload-file`
    if (this.selectedDocumento?.contenido) {
      this.transformedArchivo = [
        {
          name: this.selectedDocumento.nombreArchivo ?? "Archivo sin nombre",
          type: this.selectedDocumento.contenido.split(";")[0]?.split(":")[1] ?? "application/octet-stream",
          content: this.selectedDocumento.contenido,
        },
      ];
      console.log('archivo: ', this.transformedArchivo);
    } else {
      this.transformedArchivo = [];
    }

    this.displayEditModalDocumento = true;
  }

  handleFileChanges(event: { archivos: any[]; nombres: string[] }): void {
    // Actualiza el archivo en el formulario
    if (event.archivos.length > 0) {
      this.selectedDocumento.contenido = event.archivos[0]?.content || ""; // Base64 del archivo con valor predeterminado
      this.selectedDocumento.nombreArchivo = event.archivos[0]?.name || "Archivo sin nombre"; // Nombre del archivo con valor predeterminado
    } else {
      this.selectedDocumento.contenido = ''; // Valores vacíos si no hay archivo
      this.selectedDocumento.nombreArchivo = '';
    }
  }

  updateDocumento(): void {
    if (this.selectedDocumento) {
      this.documentosService.updateDocumento(this.selectedDocumento.documentoId, this.selectedDocumento).subscribe({
        next: (response) => {
          console.log(response);
          this.messageService.add({
            severity: 'success',
            summary: 'Documento Actualizado',
            detail: 'El documento ha sido actualizado correctamente.',
          });
          this.displayEditModalDocumento = false;
          this.loadDocumentos(); // Recargar la lista de documentos actualizada
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al actualizar el documento.',
          });
          console.error(err);
        },
      });
    }
  }

  displayEditModalCaso: boolean = false;
  transformedArchivos: { name: string; type: string; content: string }[] = [];

  editCaso(caso: CasoDTO) {
    this.selectedCasoUser = { ...caso }; // Crear una copia del caso para evitar modificaciones no intencionales
    if (this.selectedCasoUser.archivos && this.selectedCasoUser.archivos.length > 0) {
      this.transformedArchivos = this.selectedCasoUser.archivos.map((archivo, index) => {
        return {
          name: this.selectedCasoUser.nombreArchivo[index] || `Archivo_${index + 1}`, // Usa el nombre si está disponible
          type: archivo.split(';')[0].split(':')[1], // Extrae el tipo MIME del archivo
          content: archivo, // El contenido base64 original
        };
      });
    } else {
      this.transformedArchivos = []; // Inicializa como arreglo vacío si no hay archivos
    }
    this.displayEditModalCaso = true;
  }

  resetFile(event: boolean){

  }

  setFile(listB64: string[]) {
    console.log("aqui si entra",listB64)
    this.selectedCasoUser.imagenes = listB64;
  }

  updateCaso() {
    console.log('caso:', this.selectedCasoUser);
    if (!this.selectedCasoUser.duracion || this.selectedCasoUser.duracion <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La duración debe ser mayor a 0 días.',
      });
      return;
    }
    if (this.selectedCasoUser) {
      this.casosService.updateCaso(this.selectedCasoUser).subscribe(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Caso actualizado',
            detail: 'La fecha de finalización ha sido actualizada.',
          });
          this.displayEditModalCaso = false;
          this.loadCasos(); // Recargar la lista de casos después de la actualización
        },
        error => {
          console.error('Error al actualizar el caso:', error);
        }
      );
    }
  }

  closeEditModalCaso(){
    this.displayEditModalCaso = false;
  }

  calcularNuevaFechaFinalizacion() {
    if (!this.selectedCasoUser.fechaFinalizacion || !this.selectedCasoUser.duracion) {
      return;
    }

    // Convertir la fecha de finalización actual en objeto Date
    let fechaFinalizacionActual = new Date(this.selectedCasoUser.fechaFinalizacion);

    // Sumar la nueva duración en días
    fechaFinalizacionActual.setDate(fechaFinalizacionActual.getDate() + Number(this.selectedCasoUser.duracion));

    // Actualizar el campo con el nuevo valor
    this.selectedCasoUser.fechaFinalizacion = fechaFinalizacionActual; // Formato estándar
  }

  esEditable(fechaFinalizacion: string | Date, estado: string): boolean {
    if (!fechaFinalizacion) return false; // Si no hay fecha de finalización, no se puede editar
    if (estado.toLowerCase() === 'cerrado') return false; // Si el caso está cerrado, no se puede editar

    let fechaFin = new Date(fechaFinalizacion); // Convertir la fecha de finalización a Date
    let hoy = new Date(); // Obtener la fecha actual

    // El caso solo es editable si la fecha de finalización es anterior o igual a hoy
    return fechaFin <= hoy;
  }

  validarEdicion(caso: any) {
    if (!this.esEditable(caso.fechaFinalizacion, caso.estado)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Editable',
        detail: 'Solo se puede editar si la fecha de finalización ya ha pasado y el caso no está cerrado.',
      });
      return;
    }

    // Si la validación pasa, permitir la edición
    this.editCaso(caso);
  }

  closeEditModalDocumento() {
    this.displayEditModalDocumento = false;
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
    //this.selectedCaso = caso;
    this.selectedCaso = {
      ...caso,
      imagenes: caso.imagenes?.filter(imagen => imagen.trim() !== '') ?? [],
      archivos: caso.archivos?.filter(archivo => archivo.trim() !== '') ?? []
    }
    this.displayModal = true;
  }

  visualizarDocumento(documento: DocumentoDTO){
    this.selectedDocumento = documento;
    this.displayModalDocumento = true;
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
    // if(this.seguimientoForm.valid){
    //   const seguimientoData = {
    //     casoId: this.selectedCasoUser.casoId,
    //     usuarioId: this.authService.getCurrentUser()?.usuarioId,
    //     observacion: this.seguimientoForm.value.observacion,
    //     progreso: this.seguimientoForm.value.progreso
    //   };
    //   this.seguimientoService.agregarSeguimiento(seguimientoData).subscribe({
    //     next: (response) => {
    //       this.messageService.add({
    //         severity: 'success',
    //         summary: 'Seguimiento Guardado',
    //         detail: 'El seguimiento fue guardado exitosamente',
    //       });
    //       this.displaySeguimientoModal = false;
    //     },
    //     error: (error) => {
    //       this.messageService.add({
    //         severity: 'error',
    //         summary: 'Error',
    //         detail: 'Hubo un problema al guardar el seguimiento',
    //       })
    //     }
    //   })
    // }
    if (this.seguimientoForm.valid) {
      const seguimientoData = {
          casoId: this.selectedCasoUser?.casoId,
          usuarioId: this.authService.getCurrentUser()?.usuarioId,
          observacion: this.seguimientoForm.value.observacion,
          progreso: this.seguimientoForm.value.progreso,
      };

      if (!seguimientoData.casoId) {
          this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo identificar el caso. Por favor, inténtalo de nuevo.',
          });
          return;
      }

      const mensaje = `El caso '${this.selectedCasoUser?.asunto}' tiene un progreso actual de ${seguimientoData.progreso}%. Observación: ${seguimientoData.observacion}`;

      if (!mensaje || mensaje.trim() === '') {
          this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'El mensaje no se generó correctamente.',
          });
          return;
      }

      this.seguimientoService.notificarRetraso(seguimientoData.casoId, mensaje).subscribe({
          next: () => {
              this.messageService.add({
                  severity: 'success',
                  summary: 'Notificación Enviada',
                  detail: 'Se notificó al abogado sobre el retraso del caso.',
              });
              this.displaySeguimientoModal = false;
          },
          error: (err) => {
              this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Hubo un problema al notificar al abogado.',
              });
              console.error(err);
          },
      });
    }
  }

  extraerTipoArchivo(archivo: string): string {
    const match = archivo.match(/^data:(.*?);base64,/);
    return match ? match[1] : 'application/octet-stream';  // Si no se encuentra, usa un genérico
  }

  downloadPDF() {
    if (this.selectedCaso) {
        const doc = new jsPDF();
        let cursorY = 20;

        // Logo del consultorio
        const logoPath = 'assets/image/logo.png';
        doc.addImage(logoPath, 'PNG', 15, cursorY, 50, 20);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text('Consultorio Jurídico', 80, cursorY + 15);
        cursorY += 35;

        // Fecha de registro
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const fechaRegistro = this.selectedCaso.fechaRegistro
            ? new Date(this.selectedCaso.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : "No especificada.";
        doc.text(`Fecha Registro: ${fechaRegistro}`, 15, cursorY);
        cursorY += 15;

        // Detalles del caso
        doc.setFont("helvetica", "bold");
        doc.text('Detalles del Caso', 15, cursorY);
        cursorY += 10;

        const details = [
            { label: 'Nombre del Cliente', value: this.selectedCaso.nombreCliente || "No especificado." },
            { label: 'Nombre del Abogado a Cargo', value: this.selectedCaso.nombreAbogado || "No especificado." },
            { label: 'Tipo de Caso', value: this.selectedCaso.tipoCaso || "No especificado." },
            { label: 'Duración del Caso', value: `${this.selectedCaso.duracion || "No especificada."} días` },
            { label: 'Fecha de Finalización del Caso', value: this.selectedCaso.fechaFinalizacion
                ? new Date(this.selectedCaso.fechaFinalizacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : "No especificada." },
        ];

        details.forEach(({ label, value }) => {
            doc.setFont("helvetica", "bold");
            doc.text(`• ${label}:`, 15, cursorY);
            const textWidth = doc.getTextWidth(`• ${label}: `);
            doc.setFont("helvetica", "normal");
            doc.text(value, 15 + textWidth, cursorY);
            cursorY += 10;

            if (cursorY > doc.internal.pageSize.height - 20) {
                doc.addPage();
                cursorY = 20;
            }
        });

        // Descripción del caso
        doc.setFont("helvetica", "bold");
        doc.text('Descripción del Caso', 15, cursorY);
        cursorY += 10;
        doc.setFont("helvetica", "normal");
        const descripcion = this.selectedCaso.descripcion || "No especificada.";
        doc.text(descripcion, 15, cursorY, { maxWidth: 180 });
        cursorY += 20;

        // Observaciones
        if (this.selectedCaso.seguimientos && this.selectedCaso.seguimientos.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text('Observaciones', 15, cursorY);
          cursorY += 10; // Espacio después del título

          this.selectedCaso.seguimientos.forEach((seguimiento: any, index: number) => {
            doc.setFont("helvetica", "normal");

            const observacion = `Observación ${index + 1}: ${seguimiento.observacion}`;
            const progreso = `Progreso: ${seguimiento.progreso}%`;
            const fechaRegistro = `Fecha: ${new Date(seguimiento.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

            // Verificar espacio disponible
            if (cursorY + 25 > doc.internal.pageSize.height - 20) {
                doc.addPage();
                cursorY = 20;
            }

            doc.text(observacion, 15, cursorY, { maxWidth: 180 });
            cursorY += 7;

            doc.text(progreso, 15, cursorY, { maxWidth: 180 });
            cursorY += 7;

            doc.text(fechaRegistro, 15, cursorY, { maxWidth: 180 });
            cursorY += 10; // Espaciado final
        });
      } else {
          // Sin observaciones
          if (cursorY + 10 > doc.internal.pageSize.height - 20) {
              doc.addPage();
              cursorY = 20; // Reiniciar cursor en la nueva página
          }

          doc.setFont("helvetica", "bold");
          doc.text('Observaciones', 15, cursorY);
          cursorY += 10;

          doc.setFont("helvetica", "normal");
          doc.text('No hay observaciones registradas.', 15, cursorY);
          cursorY += 20; // Espacio después del mensaje
      }

        // Imágenes adjuntas
        if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text('Imágenes Adjuntas', 15, cursorY);
            cursorY += 10;

            this.selectedCaso.imagenes.forEach((base64Image: string) => {
              const imgWidth = 70;
              const imgHeight = 70;

              if (cursorY + imgHeight > doc.internal.pageSize.height - 20) {
                  doc.addPage();
                  cursorY = 20;
              }

              doc.addImage(base64Image, 'JPEG', 15, cursorY, imgWidth, imgHeight);
              cursorY += imgHeight + 10;
          });
        } else {
            doc.setFont("helvetica", "normal");
            doc.text('No hay imágenes adjuntas para este caso.', 15, cursorY);
        }

        // Guardar el PDF
        doc.save(`Informe_Caso_${this.selectedCaso.casoId}.pdf`);
    }
  }

  // downloadPDF() {
  //   if (this.selectedCaso) {
  //       const doc = new jsPDF();
  //       let cursorY = 20; // Margen inicial superior

  //       // Agregar logo del consultorio
  //       const logoPath = 'assets/image/logo.png';
  //       const logoX = 15; // Coordenada X del logo
  //       const logoWidth = 50; // Ancho del logo
  //       const logoHeight = 20; // Alto del logo
  //       doc.addImage(logoPath, 'PNG', logoX, cursorY, logoWidth, logoHeight);

  //       // Título alineado al logo
  //       doc.setFontSize(16);
  //       doc.setFont("helvetica", "bold");
  //       const titleX = logoX + logoWidth + 10; // Alinear el título a la derecha del logo
  //       doc.text('Consultorio Jurídico', titleX, cursorY + 15); // Alineación vertical ajustada
  //       cursorY += logoHeight + 10;

  //       // Fecha de registro
  //       doc.setFontSize(12);
  //       doc.setFont("helvetica", "normal");
  //       const fechaRegistro = this.selectedCaso.fechaRegistro
  //           ? new Date(this.selectedCaso.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  //           : "No especificada.";
  //       doc.text(`Fecha Registro: ${fechaRegistro}`, 15, cursorY);
  //       cursorY += 15;

  //       // Detalles del caso
  //       doc.setFont("helvetica", "bold");
  //       doc.text('Detalles del Caso', 15, cursorY);
  //       cursorY += 10;
  //       doc.setFont("helvetica", "normal");
  //       const details = [
  //           { label: 'Nombre del Cliente', value: this.selectedCaso.nombreCliente || "No especificado." },
  //           { label: 'Nombre del Abogado a Cargo', value: this.selectedCaso.nombreAbogado || "No especificado." },
  //           { label: 'Tipo de Caso', value: this.selectedCaso.asunto || "No especificado." },
  //           { label: 'Duración del Caso', value: `${this.selectedCaso.duracion || "No especificada."} días` },
  //           { label: 'Fecha de Finalización del Caso', value: this.selectedCaso.fechaFinalizacion
  //               ? new Date(this.selectedCaso.fechaFinalizacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  //               : "No especificada." },
  //       ];

  //       details.forEach(({ label, value }) => {
  //           doc.setFont("helvetica", "bold");
  //           doc.text(`• ${label}:`, 15, cursorY); // Agregar viñeta y texto en negrita
  //           const textWidth = doc.getTextWidth(`• ${label}: `); // Calcular el ancho de la etiqueta
  //           doc.setFont("helvetica", "normal");
  //           doc.text(value, 15 + textWidth, cursorY); // Texto del valor alineado
  //           cursorY += 10;

  //           // Verificar si es necesario agregar una nueva página
  //           if (cursorY > doc.internal.pageSize.height - 20) {
  //               doc.addPage();
  //               cursorY = 20;
  //           }
  //       });

  //       // Información de la cita judicial
  //       doc.setFont("helvetica", "bold");
  //       doc.text('Información de la Cita Judicial', 15, cursorY);
  //       cursorY += 10;
  //       doc.setFont("helvetica", "normal");
  //       const citaDetails = [
  //           { label: 'Fecha de la Cita Judicial', value: this.selectedCaso.fechaCita
  //               ? new Date(this.selectedCaso.fechaCita).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  //               : "No especificada." },
  //           { label: 'Asunto de la Cita', value: this.selectedCaso.asunto || "No especificado." },
  //       ];

  //       citaDetails.forEach(({ label, value }) => {
  //           doc.setFont("helvetica", "bold");
  //           doc.text(`• ${label}:`, 15, cursorY); // Agregar viñeta y texto en negrita
  //           const textWidth = doc.getTextWidth(`• ${label}: `);
  //           doc.setFont("helvetica", "normal");
  //           doc.text(value, 15 + textWidth, cursorY); // Texto del valor alineado
  //           cursorY += 10;

  //           if (cursorY > doc.internal.pageSize.height - 20) {
  //               doc.addPage();
  //               cursorY = 20;
  //           }
  //       });

  //       // Descripción del caso
  //       doc.setFont("helvetica", "bold");
  //       doc.text('Descripción del Caso', 15, cursorY);
  //       cursorY += 10;
  //       doc.setFont("helvetica", "normal");
  //       const descripcion = this.selectedCaso.descripcion || "No especificada.";
  //       doc.text(descripcion, 15, cursorY, { maxWidth: 180 });
  //       cursorY += 20;

  //       // Imágenes adjuntas
  //       if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
  //           doc.setFont("helvetica", "bold");
  //           doc.text('Imágenes Adjuntas', 15, cursorY);
  //           cursorY += 10;

  //           this.selectedCaso.imagenes.forEach((base64Image: string) => {
  //               const imgWidth = 70;
  //               const imgHeight = 70;

  //               if (cursorY + imgHeight > doc.internal.pageSize.height) {
  //                   doc.addPage();
  //                   cursorY = 20;
  //               }

  //               doc.addImage(base64Image, 'JPEG', 15, cursorY, imgWidth, imgHeight);
  //               cursorY += imgHeight + 10;
  //           });
  //       } else {
  //           doc.setFont("helvetica", "normal");
  //           doc.text('No hay imágenes adjuntas para este caso.', 15, cursorY);
  //       }

  //       // Guardar el PDF
  //       doc.save(`Informe_Caso_${this.selectedCaso.casoId}.pdf`);
  //   }
  // }

  // downloadPDF() {
  //   if (this.selectedCaso) {
  //       const doc = new jsPDF();
  //       let finalY = 30; // Posición inicial después del título

  //       // Título del Documento
  //       doc.setFontSize(20);
  //       doc.setFont("helvetica", "bold");
  //       doc.text('Detalles del Caso', 105, 15, { align: "center" });

  //       // Datos a excluir (como IDs y otros innecesarios)
  //       const excludedFields = ['casoId', 'abogadoId', 'clienteId', 'citaId', 'imagenes', 'archivos', 'especialidadDescripcion', 'fechaCita', 'nombreArchivo'];

  //       const fieldMapping: { [key: string]: string } = {
  //           asunto: 'Asunto',
  //           descripcion: 'Descripción',
  //           nombreCliente: 'Cliente',
  //           nombreAbogado: 'Abogado',
  //           fechaRegistro: 'Fecha del Caso',
  //           estado: 'Estado',
  //           duracion: 'Duracion',
  //           fechaFinalizacion: 'Fecha de finalizacion del caso',
  //           progreso: 'Progreso'
  //       };

  //       // Formateo y mapeo de los datos
  //       const data = this.selectedCaso
  //         ? Object.keys(this.selectedCaso)
  //             .filter(key => !excludedFields.includes(key))
  //             .map(key => [
  //               fieldMapping[key] || key, // Mapea el nombre del campo
  //               (() => {
  //                 const value = this.selectedCaso?.[key as keyof CasoDTO];
  //                 if (key === 'fechaRegistro') {
  //                   // Manejo específico para el campo fechaRegistro
  //                   if (value instanceof Date) {
  //                     return value.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  //                   }
  //                   if (typeof value === 'string') {
  //                     try {
  //                       return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  //                     } catch {
  //                       return value; // Devuelve el valor como está si no se puede convertir
  //                     }
  //                   }
  //                   return ''; // Valor por defecto si no es ni Date ni string
  //                 }
  //                 // Manejo genérico para otros campos
  //                 if (Array.isArray(value)) {
  //                   return value.join(', ');
  //                 }
  //                 return value?.toString() ?? '';
  //               })()
  //             ])
  //         : [];

  //       // Generar tabla con los datos
  //       autoTable(doc, {
  //           startY: finalY,
  //           head: [['Campo', 'Valor']],
  //           body: data,
  //           styles: {
  //               fontSize: 11,
  //               cellPadding: 3,
  //               minCellHeight: 10
  //           },
  //           headStyles: {
  //               fillColor: [41, 128, 185],
  //               textColor: 255,
  //               fontStyle: 'bold'
  //           },
  //           alternateRowStyles: {
  //               fillColor: [245, 245, 245]
  //           },
  //           margin: { top: 25, left: 15, right: 15 },
  //           didDrawPage: (data) => {
  //             finalY = data.cursor?.y ?? 30; // Actualizamos la posición final de la tabla
  //           }
  //       });

  //       // Agregar imágenes
  //       if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
  //         let imgY = finalY + 10; // Espacio después de la tabla
  //         this.selectedCaso.imagenes.forEach((base64Image: string) => {
  //           const imgWidth = 50; // Ancho de la imagen
  //           const imgHeight = 50; // Alto de la imagen

  //           // Verificar si la imagen cabe en la página actual
  //           if (imgY + imgHeight > doc.internal.pageSize.height) {
  //             doc.addPage(); // Crear nueva página
  //             imgY = 10; // Reiniciar posición en la nueva página
  //           }

  //           doc.addImage(base64Image, 'JPEG', 15, imgY, imgWidth, imgHeight);
  //           imgY += imgHeight + 10; // Incrementar posición para la siguiente imagen
  //         });
  //       }

  //       // Guardar el PDF con un nombre dinámico
  //       doc.save(`Detalles_Caso_${this.selectedCaso.casoId}.pdf`);
  //   }
  // }

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
