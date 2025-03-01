import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, NgForm, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CitaDTO, IDuracionCita } from 'src/app/interfaces/citas';
import { EspecialidadDTO, UsuarioDTO } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';
import { CitasService } from 'src/app/services/citas.service';

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent implements OnInit {
  @Output() citaCreada = new EventEmitter<CitaDTO>();

  showLoading: boolean = false;
  especialidadesDTO: EspecialidadDTO[] = [];
  abogadosDTO: UsuarioDTO[] = [];
  selectedEspecialidad: number | null = null;
  selectedDuracion!: number;
  selectedAbogado: number | null = null;
  newCita: CitaDTO = {
    citaId: 0,
    fechaHora: '',
    descripcion: '',
    clienteId: 0,
    estado: 'Pendiente',
    especialidad: '',
    nombreAbogado: '',
    duracion: 0,
    especialidadId: 0
  };
  citaForm!: FormGroup;
  minDate!: string;
  abogadoDisabled: boolean = true;
  visible: boolean = false;
  citasAsignadasPendientes: CitaDTO[] = [];

  showDialog() {

    this.onAbogadoChange();
      this.visible = true;
  }
  constructor(private fb: FormBuilder, private citaService: CitasService, private authService: AuthService, private router: Router, private messageService: MessageService) {
    this.setMinDate();
  }

  listaDuracion: IDuracionCita[] =[
    {label: '30 minutos', value: 30},
    {label: '60 minutos', value: 60},
    {label: '90 minutos', value: 90},
  ]

  setMinDate() {
    const currentDate = new Date();
    currentDate.setHours(9, 0, 0); // Establece la hora mínima a las 9:00 AM
    if (currentDate.getHours() > 17) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(9, 0, 0); // Si es después de las 5:00 PM, la fecha mínima es el día siguiente a las 9:00 AM
    }
    this.minDate = currentDate.toISOString().slice(0, 16); // Convierte la fecha a formato local y recorta los segundos
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual:', currentUser);
    this.citaForm = this.fb.group({
      descripcion: ['', Validators.required],
      especialidadId: ['', Validators.required],
      abogadoId: [''],
      abogado: [{ value: '', disabled: true}, Validators.required],
      fechaHora: ['', [Validators.required, noWeekendsValidator()]],
      duracion: ['', Validators.required],
      clienteId: [currentUser ? currentUser.usuarioId : 0, Validators.required],
      nombreCliente: [currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : '']
    });
    console.log('Formulario:', this.citaForm.value);
    this.loadEspecialidades();
    if (currentUser) {
      this.newCita.clienteId = currentUser.usuarioId;
    }

  }

  loadEspecialidades(): void {
    this.showLoading = true;
    this.authService.getEspecialidades().subscribe({
      next: (data) => {
        // Filtrar para excluir la primera especialidad con Id 1
        this.especialidadesDTO = data.filter(especialidad => especialidad.especialidadId !== 1);
      },
      complete: () => {
        this.showLoading = false;
      }
    });
  }

  onEspecialidadChange(event: any): void {
    const especialidadId = +event.target.value;
    this.citaForm.get('abogado')?.disable();
    this.selectedAbogado = null; // Resetea el abogado seleccionado cada vez que cambia la especialidad
    this.abogadoDisabled = true;
    if (especialidadId === 1) {
      this.abogadosDTO = [];
    } else {
      this.authService.getAbogadosByEspecialidad(especialidadId).subscribe({
        next: (abogados) => {
          const abogadosActivos = abogados.filter(a => a.estado === 'A');
          this.abogadosDTO = abogadosActivos;

          if (abogadosActivos.length > 0) {
            //this.citaForm.patchValue({ abogado: abogadosActivos[0].usuarioId });
            this.citaForm.get('abogado')?.enable();
            this.abogadoDisabled = false;
          } else {
            this.messageService.add({ severity: 'warn', summary: 'Sin abogados', detail: 'No hay abogados disponibles' });
          }
        }
      });
    }
  }

  canCreateCita(): boolean {
    return this.citaForm.valid;
  }

  createCita(): void {
    const selectedDate = new Date(this.citaForm.value.fechaHora);
    const now = new Date();
    //now.setMinutes(0, 0, 0); // Elimina minutos y segundos para comparación justa
    now.setSeconds(0, 0);
    const minAllowedTime = new Date(now.getTime() + 15 * 60 * 1000);

    if(selectedDate < minAllowedTime){
      this.messageService.add({
        severity: 'warn',
        summary: 'Horario no válido',
        detail: 'Debes seleccionar un horario con al menos 15 minutos de diferencia respecto a la hora actual.'
      });
      return;
    }

    // Validación de horario
    if (selectedDate < now || selectedDate.getHours() < 9 || selectedDate.getHours() > 17) {
        this.messageService.add({ severity: 'warn', summary: 'Horario no válido', detail: 'Seleccione un horario entre las 9:00 y las 17:00' });
        return;
    }

    if (this.citaForm.invalid) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Complete todos los campos correctamente.' });
        return;
    }

    if (this.citaForm.value.especialidadId === '1') {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se puede crear una cita con la especialidad "Ninguna".' });
        return;
    }

    this.showLoading = true;

    // Buscar el nombre de la especialidad seleccionada
    const especialidadSeleccionada = this.especialidadesDTO.find(e => e.especialidadId === +this.citaForm.value.especialidadId);
    const abogadoSeleccionado = this.abogadosDTO.find(a => a.usuarioId === +this.citaForm.value.abogado);

    // Obtener el usuario actual
    const usuarioActual = this.authService.getCurrentUser();

    // Asignar valores desde el formulario
    const citaData: CitaDTO = {
        ...this.citaForm.value,
        clienteId: usuarioActual ? usuarioActual.usuarioId : 0,
        abogadoId: abogadoSeleccionado?.usuarioId,
        nombreAbogado: abogadoSeleccionado ? `${abogadoSeleccionado.nombre} ${abogadoSeleccionado.apellido}` : '',
        nombreCliente: usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : '',
        especialidad: especialidadSeleccionada ? especialidadSeleccionada.descripcion : 'No especificada', // Asignar el nombre de la especialidad
        estado: 'Pendiente'
    };

    console.log('datos cita: ', citaData);

    this.authService.createCita(citaData).subscribe({
        next: (response) => {
            //this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cita creada exitosamente' });
            this.citaCreada.emit(response);
            this.resetForm();
        },
        error: (error) => {
            const errorMsg = error.error.message || 'Error inesperado al crear la cita';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
            console.error('Error creando la cita:', error);
            this.showLoading = false;
        },
        complete: () => {
            this.showLoading = false;
        }
    });
  }

  resetForm(): void {
    this.citaForm.reset();
    this.abogadoDisabled = true;
    this.citaForm.patchValue({ clienteId: this.authService.getCurrentUser()?.usuarioId });
  }

  navigateHome() {
    this.router.navigate(['/home']); // Asegúrate de cambiar '/home' por la ruta correcta
  }

  onAbogadoChange(): void {
    if (this.citaForm.value.abogado) {
      this.showLoading = true;
      this.citaService.getCitasAsignadas(this.citaForm.value.abogado).subscribe({
        next: (citas) => {
          this.citasAsignadasPendientes = citas.filter(c => c.estado === 'Aceptado' || c.estado === 'Pendiente');
        },
        complete: () => {
          this.showLoading = false;
        }
      });
    }
  }
}

export function noWeekendsValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) {
      return null; // Si el campo está vacío, no validar aún.
    }
    const selectedDate = new Date(control.value);
    const day = selectedDate.getDay(); // 0 = Domingo, 6 = Sábado

    return day === 0 || day === 6
      ? { weekendNotAllowed: true } // Devuelve un error si es sábado o domingo
      : null;
  };
}
