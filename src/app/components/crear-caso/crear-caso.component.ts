import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CasoDTO } from 'src/app/interfaces/caso';
import { CitaDTO } from 'src/app/interfaces/citas';
import { FileUpload } from 'src/app/interfaces/file';
import { EspecialidadDTO } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';
import { CasosService } from 'src/app/services/casos.service';
import { CitasService } from 'src/app/services/citas.service';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-crear-caso',
  templateUrl: './crear-caso.component.html',
  styleUrls: ['./crear-caso.component.css']
})
export class CrearCasoComponent {
  form: FormGroup;
  citas: CitaDTO[] = [];
  selectedCita: CitaDTO | null = null;
  showLoading: boolean = false;
  b64Img: string = "";
  isLoading: boolean = false;
  imagenes: string[]=[];
  archivosBase64: FileUpload = { archivos: [], nombres: [] };

  progreso: number = 0;

  @Output() crearCaso = new EventEmitter<CasoDTO>();

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private citasService: CitasService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private casosService: CasosService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      citaAsignada: [''],
      nombreCliente: [{ value: '', disabled: true }],
      fechaCita: [{ value: '', disabled: true }],
      descripcionCaso: [''],
      especialidad: [{ value: '', disabled: true }],
      responsable: [{ value: '', disabled: true }],
      asuntoCaso: [''],  // Asegúrate que esto es requerido
      estadoCaso: [''],  // y también esto
      duracion: ['', [Validators.required, Validators.min(1)]],
      fechaFinalizacion: [{value: '', disabled: true}],
      progreso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      tipoCaso: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarCitasAceptadas();
    //this.loadEspecialidades();
  }

  setFile(listB64: string[]) {
    this.imagenes = listB64;
  }

  resetFile(event: boolean){

  }

  setFiles(files: FileUpload) {
    this.archivosBase64 = files;
  }

  calcularFechaFinalizacion(): void {
    const duracion = this.form.get('duracion')?.value; // Duración en días
    const fechaRegistro = new Date(); // Fecha actual
    if (duracion > 0) {
      // Calcula la fecha final
      const fechaFinalizacion = this.calcularFechaLaboral(parseInt(duracion, 10));

      this.form.patchValue({ fechaFinalizacion })
      // const fechaFinalizacion = new Date(fechaRegistro);
      // fechaFinalizacion.setDate(fechaRegistro.getDate() + parseInt(duracion, 10));

      // // Formatea la fecha al formato 'yyyy-MM-dd' requerido por el input de tipo date
      // const fechaFinalizacionISO = fechaFinalizacion.toISOString().split('T')[0];

      // // Actualiza el valor del campo en el formulario
      // this.form.patchValue({ fechaFinalizacion: fechaFinalizacionISO });
    }
  }

  private calcularFechaLaboral(duracion: number): string {
    const fechaInicio = new Date(); // Fecha actual
    let diasRestantes = duracion;
    const fechaFinal = new Date(fechaInicio);

    while (diasRestantes > 0) {
      fechaFinal.setDate(fechaFinal.getDate() + 1); // Avanza un día

      // Verifica si el día no es sábado (6) ni domingo (0)
      const esFinDeSemana = fechaFinal.getDay() === 0 || fechaFinal.getDay() === 6;

      if (!esFinDeSemana) {
        diasRestantes--; // Resta un día solo si es laborable
      }
    }

    // Devuelve la fecha en formato 'yyyy-MM-dd'
    return fechaFinal.toISOString().split('T')[0];
  }

  cargarCitasAceptadas(): void {
    const abogadoId = this.authService.getLoggedUserId();  // Asume que este método está implementado correctamente
    if (!abogadoId) {
      console.error('Error: No se pudo obtener el ID del abogado logueado');
      return;
    }

    this.casosService.getCitasAceptadas(abogadoId).subscribe(citas => {
      this.citas = citas;
      console.log(citas);  // Agrega esto para ver qué datos estás recibiendo realmente
    }, error => {
      console.error('Error al cargar las citas aceptadas:', error);
    });
  }

  especialidades: EspecialidadDTO[] = [];

  onCitaSelected(event: any): void {
    const citaId = event.target.value;
    this.citasService.getCitaDetails(citaId).subscribe({
      next: (cita) => {
        this.selectedCita = cita;  // Almacena toda la información de la cita seleccionada
        this.form.patchValue({
          nombreCliente: cita.nombreCliente || 'No disponible',
          fechaCita: cita.fechaHora ? new Date(cita.fechaHora).toISOString().substring(0, 10) : 'No disponible',
          especialidad: cita.especialidad || 'No especificada',
          responsable: cita.nombreAbogado || 'No asignado',
        });
        console.log('Cita seleccionada:', cita);
      },
      error: (error) => console.error('Error al obtener los detalles de la cita:', error)
    });
  }

  guardarCaso(): void {
    this.showLoading = true;
    if (this.form.valid && this.selectedCita) {
      const casoData: CasoDTO = {
        abogadoId: this.selectedCita.abogadoId ?? 0,
        clienteId: this.selectedCita.clienteId ?? 0,
        citaId: this.selectedCita.citaId,
        descripcion: this.form.get('descripcionCaso')!.value,
        especialidadDescripcion: this.selectedCita.especialidad || 'No especificada',
        estado: this.form.get('estadoCaso')!.value,
        asunto: this.form.get('asuntoCaso')!.value,
        nombreCliente: this.selectedCita.nombreCliente || '',
        nombreAbogado: this.selectedCita.nombreAbogado || '',
        fechaCita: new Date(this.selectedCita.fechaHora),
        imagenes: this.imagenes,
        archivos: this.archivosBase64.archivos.map(file => file.content),
        nombreArchivo: this.archivosBase64.archivos.map(file => file.name),
        duracion: this.form.get('duracion')!.value,
        fechaFinalizacion: this.form.get('fechaFinalizacion')!.value,
        progreso: 0,
        tipoCaso: this.form.get('tipoCaso')!.value,
      };

      console.log('data caso: ', casoData);

      this.showLoading = true;
      this.casosService.crearCaso(casoData).subscribe({
        next: (response) => {
          console.log(casoData);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Caso creado exitosamente' })
          console.log("Caso creado con éxito", response);
          //this.router.navigate(['/casos-realizados']);
          this.crearCaso.emit(response);
          this.form.reset();

        },
        error: (error) => {
          console.error("Error al crear caso", error)
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear el caso' })
        },
        complete: () => {
          this.showLoading = false;
        }
      });
    } else {
      console.error('Formulario no es válido', this.form.errors);
    }
  }

  checkCasoDuplicado() {
    const clienteId = this.form.get('clienteId')?.value;
    const asunto = this.form.get('asunto')?.value;
    const citaId = this.selectedCita?.citaId;

    if (!clienteId || !asunto || !citaId) {
      this.messageService.add({
          severity: 'warn',
          summary: 'Validación incompleta',
          detail: 'Ya existe un caso asociado a esta cita.',
      });
      return; // Salir del método si los datos son incompletos
    }

    this.casosService.verificarCasoDuplicado(clienteId, asunto, citaId).subscribe({
        next: (existe) => {
            if (existe) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Caso duplicado',
                    detail: 'Ya existe un caso con el mismo cliente, asunto y cita asignada.',
                });
            }
        },
        error: (err) => console.error('Error al verificar caso duplicado:', err)
    });
  }

  navigateToPanel(): void {
    this.router.navigate(['/abogados']); // Asegúrate de usar la ruta correcta aquí
  }
}
