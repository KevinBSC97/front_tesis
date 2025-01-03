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
      estadoCaso: ['']  // y también esto
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
        nombreArchivo: this.archivosBase64.archivos.map(file => file.name)
      };

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

  navigateToPanel(): void {
    this.router.navigate(['/abogados']); // Asegúrate de usar la ruta correcta aquí
  }
}
