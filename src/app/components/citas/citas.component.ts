import { Component } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CitaDTO } from 'src/app/interfaces/citas';
import { EspecialidadDTO, UsuarioDTO } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent {
  especialidadesDTO: EspecialidadDTO[] = [];
  abogadosDTO: UsuarioDTO[] = [];
  selectedEspecialidad: number | null = null;
  selectedAbogado: number | null = null;
  newCita: CitaDTO = {
    citaId: 0,
    fechaHora: new Date(),
    descripcion: '',
    clienteId: 0,
    estado: 'Pendiente',
    especialidad: '',
    nombreAbogado: ''
  };
  minDate!: string;

  constructor(private authService: AuthService, private router: Router, private messageService: MessageService) {
    this.setMinDate();
  }

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
    this.authService.getEspecialidades().subscribe(data => {
      this.especialidadesDTO = data;
    });
  }

  onEspecialidadChange(event: any): void {
    const especialidadId = +event.target.value;
    this.selectedAbogado = null; // Resetea el abogado seleccionado cada vez que cambia la especialidad

    if (especialidadId === 1) {  // Si la especialidad es 'Ninguna'
      this.abogadosDTO = [];
    } else {
      this.authService.getAbogadosByEspecialidad(especialidadId).subscribe({
        next: (abogados) => {
          // Filtra para mostrar solo abogados con estado 'A'
          const abogadosActivos = abogados.filter(abogado => abogado.estado === 'A');
          this.abogadosDTO = abogadosActivos;

          if (abogadosActivos.length > 0) {
            this.selectedAbogado = abogadosActivos[0].usuarioId; // Selecciona automáticamente el primer abogado activo
          } else {
            // Mostrar mensaje de no disponibilidad
            alert('No hay un abogado disponible para esta especialidad');
            this.selectedAbogado = null; // Asegura que no se seleccione un abogado
          }
        },
        error: (error) => {
          console.error('Error al cargar abogados:', error);
          this.abogadosDTO = [];
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
    now.setMinutes(0, 0, 0); // Elimina minutos y segundos para una comparación justa

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
      this.newCita.abogadoId = this.selectedAbogado;
      this.newCita.nombreCliente = "Nombre del Cliente"; // Asegúrate de asignar este valor correctamente
      this.authService.createCita(this.newCita).subscribe({
        next: (response) => {
          this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Cita creada exitosamente'});
          this.router.navigate(['/citas']);
          this.resetForm(); // Llamar a función para resetear el formulario
        },
        error: (error) => {
          this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al crear la cita'});
          console.error('Error creando la cita', error);
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
      fechaHora: new Date(),
      descripcion: '',
      clienteId: this.newCita.clienteId,
      estado: 'Pendiente',
      especialidad: '',
      nombreAbogado: ''
    };
    this.selectedEspecialidad = null;
    this.selectedAbogado = null;
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
}
