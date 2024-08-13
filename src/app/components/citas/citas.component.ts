import { Component } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
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
export class CitasComponent {

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
    duracion: 0
  };
  minDate!: string;
  abogadoDisabled: boolean = true;
  visible: boolean = false;
  citasAsignadasPendientes: CitaDTO[] = [];

  showDialog() {

    this.onAbogadoChange();
      this.visible = true;
  }
  constructor(private citaService: CitasService, private authService: AuthService, private router: Router, private messageService: MessageService) {
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
    this.loadEspecialidades();
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.newCita.clienteId = currentUser.usuarioId;
    }

  }

  loadEspecialidades(): void {
    this.showLoading = true;

    this.authService.getEspecialidades().subscribe({
      next: (data)=>{
        this.especialidadesDTO = data;
      },
      complete: () => {
        this.showLoading = false;
      }
    });

  }

  onEspecialidadChange(event: any): void {
    const especialidadId = +event.target.value;
    this.selectedAbogado = null; // Resetea el abogado seleccionado cada vez que cambia la especialidad

    if (especialidadId === 1) {  // Si la especialidad es 'Ninguna'
      this.abogadosDTO = [];
      this.abogadoDisabled = true;
    } else {
      this.authService.getAbogadosByEspecialidad(especialidadId).subscribe({
        next: (abogados) => {
          // Filtra para mostrar solo abogados con estado 'A'
          const abogadosActivos = abogados.filter(abogado => abogado.estado === 'A');
          this.abogadosDTO = abogadosActivos;

          if (abogadosActivos.length > 0) {
            this.selectedAbogado = abogadosActivos[0].usuarioId; // Selecciona automáticamente el primer abogado activo
            this.abogadoDisabled = false; // Habilita el select de abogados
          } else {
            // Mostrar mensaje de no disponibilidad
            alert('No hay un abogado disponible para esta especialidad');
            this.abogadoDisabled = true;
            this.selectedAbogado = null; // Asegura que no se seleccione un abogado
          }
        },
        error: (error) => {
          console.error('Error al cargar abogados:', error);
          this.abogadosDTO = [];
          this.abogadoDisabled = true;
        }
      });
    }
  }

  // onEspecialidadChange(event: any): void {
  //   const especialidadId = +event.target.value; // Usar el operador '+' asegura que el valor es numérico
  //   if (especialidadId === 1) {  // Si la especialidad es 'Ninguna'
  //     this.abogadosDTO = [];
  //     this.selectedAbogado = null;
  //   } else {
  //     this.authService.getAbogadosByEspecialidad(especialidadId).subscribe({
  //       next: (abogados) => {
  //         this.abogadosDTO = abogados;
  //         if (abogados.length > 0) {
  //           this.selectedAbogado = abogados[0].usuarioId; // Selecciona automáticamente el primer abogado
  //         } else {
  //           this.selectedAbogado = null; // No hay abogados para esta especialidad
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error al cargar abogados:', error);
  //         this.abogadosDTO = [];
  //         this.selectedAbogado = null;
  //       }
  //     });
  //   }
  // }

  canCreateCita(): boolean {
    // Asegúrate de que todos los campos necesarios están completos
    if (!this.newCita.descripcion || !this.newCita.fechaHora || this.selectedEspecialidad === null || this.selectedAbogado === null) {
      return false;
    }

    // Condiciones específicas para la creación de la cita
    if (this.selectedEspecialidad === 1) {
      return false;  // No permitir crear citas con 'Ninguna' especialidad
    }

    return true;
  }

  createCita(): void {
    const selectedDate = new Date(this.newCita.fechaHora);
    const now = new Date();
    now.setMinutes(0, 0, 0);

    if (selectedDate < now || selectedDate.getHours() < 9 || selectedDate.getHours() > 17) {
      alert('La fecha y hora seleccionadas no son válidas. Por favor seleccione un horario entre las 9:00 y las 17:00 en un día futuro.');
      return;
    }
    if (!this.canCreateCita()) {
      this.messageService.add({severity:'error', summary: 'Error', detail: 'Por favor complete todos los campos correctamente antes de crear la cita.'});
      return;
    }
    if (this.selectedEspecialidad == 1) {
      this.messageService.add({severity:'error', summary: 'Error', detail: 'No se puede crear una cita con la especialidad "Ninguna"'});
      return;
    }

    if (this.selectedAbogado) {
      this.showLoading = true;
      this.newCita.abogadoId = this.selectedAbogado;
      this.newCita.duracion = Number(this.selectedDuracion);
      this.newCita.nombreCliente = "Nombre del Cliente"; // Asegúrate de asignar este valor correctamente
      this.authService.createCita(this.newCita).subscribe({
        next: (response) => {
          this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Cita creada exitosamente'});
          this.router.navigate(['/citas']);
          this.resetForm(); // Llamar a función para resetear el formulario
        },
        error: (error) => {
          this.messageService.add({severity:'error', summary: 'Error', detail: error.error});
          console.error('Error creando la cita', error);
          this.showLoading = false;
        },
        complete: () => {
          this.showLoading = false;
        }
      });
    } else {
      this.messageService.add({severity:'error', summary: 'Error', detail: 'Debe seleccionar un abogado'});
    }
  }

  resetForm(): void {
    // Resetea los valores del formulario a los valores iniciales
    this.newCita = {
      citaId: 0,
      fechaHora: '',
      descripcion: '',
      clienteId: this.newCita.clienteId,
      estado: 'Pendiente',
      especialidad: '',
      nombreAbogado: '',
      duracion: 0
    };
    this.selectedEspecialidad = null;
    this.selectedAbogado = null;
    this.abogadoDisabled = true;
  }

  // createCita(): void {
  //   if (!this.canCreateCita()) {
  //     alert('Por favor complete todos los campos correctamente antes de crear la cita.');
  //     return;
  //   }
  //   if (this.selectedEspecialidad == 1) {
  //     alert('No se puede crear una cita con la especialidad "Ninguna"');
  //     console.error('No se puede crear una cita con la especialidad "Ninguna"');
  //     return;
  //   }
  //   if (this.selectedAbogado) {
  //     this.newCita.abogadoId = this.selectedAbogado;
  //     this.newCita.nombreCliente = "Nombre del Cliente"; // Asegúrate de asignar este valor correctamente
  //     this.authService.createCita(this.newCita).subscribe({
  //       next: (response) => {
  //         console.log('Cita creada exitosamente', response);
  //         this.router.navigate(['/citas']);
  //       },
  //       error: (error) => {
  //         console.error('Error creando la cita', error);
  //       }
  //     });
  //   } else {
  //     alert('Debe seleccionar un abogado');
  //     console.error('Debe seleccionar un abogado');
  //   }
  // }

  navigateHome() {
    this.router.navigate(['/home']); // Asegúrate de cambiar '/home' por la ruta correcta
  }

  onAbogadoChange(): void {

    this.showLoading = true;
    if (this.selectedAbogado) {
      this.citaService.getCitasAsignadas(this.selectedAbogado).subscribe({
        next: (citas) => {
          this.citasAsignadasPendientes = []
          this.citasAsignadasPendientes = [...citas.filter(c => c.estado === 'Aceptado'),...citas.filter(c => c.estado === 'Pendiente')  ]
        },
        error: (error) => {
          console.error('Error al cargar las citas:', error);
        },
        complete: ()=> {
          this.showLoading = false;
        }
      });
    } else {
      console.error('No user id found');
    }
  }
}
