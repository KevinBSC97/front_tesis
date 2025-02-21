import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CitaDTO } from 'src/app/interfaces/citas';
import { AuthService } from 'src/app/services/auth.service';
import { CitasService } from 'src/app/services/citas.service';

@Component({
  selector: 'app-citas-asignadas',
  templateUrl: './citas-asignadas.component.html',
  styleUrls: ['./citas-asignadas.component.css']
})
export class CitasAsignadasComponent {
  citasAsignadas: CitaDTO[] = [];
  citasPendientes: CitaDTO[] = [];
  citasAceptadas: CitaDTO[] = [];
  citasRechazadas: CitaDTO[] = [];
  minDate: string = new Date().toISOString().slice(0, 16); // Ajusta según necesidades
  maxDate: string = new Date().toISOString().slice(0, 16); // Ajusta según necesidades
  showLoading: boolean = false;

  constructor(private citaService: CitasService, private router: Router, private authService: AuthService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadCitas();
    this.setDateTimeLimits();
  }

  setDateTimeLimits(): void {
    let currentDate = new Date();
    currentDate.setHours(9, 0, 0, 0);  // La hora mínima del día actual
    this.minDate = currentDate.toISOString().slice(0, 16);

    let maxDate = new Date();
    maxDate.setHours(17, 0, 0, 0);  // La hora máxima del día actual
    this.maxDate = maxDate.toISOString().slice(0, 16);
  }

  loadCitas(): void {
    this.showLoading = true;
    const userId = this.authService.getCurrentUser()?.usuarioId;
    if (userId) {
      this.citaService.getCitasAsignadas(userId).subscribe({
        next: (citas) => {
          console.log(citas);
          this.citasPendientes = citas.filter(c => c.estado === 'Pendiente');
          this.citasAceptadas = citas.filter(c => c.estado === 'Aceptado');
          this.citasRechazadas = citas.filter(c => c.estado === 'Rechazada');
        },
        error: (error) => {
          console.error('Error al cargar las citas:', error);
        },
        complete: () => {
          this.showLoading = false;
        }
      });
    } else {
      console.error('No user id found');
    }
  }

  // updateEstado(citaId: number, fechaHora: string, nuevoEstado: string): void {
  //   let updatedDate = new Date(fechaHora);

  //   // Verifica que updatedDate sea un objeto Date válido antes de llamar a getHours()
  //   if (!(updatedDate instanceof Date && !isNaN(updatedDate.getTime()))) {
  //     this.messageService.add({
  //       severity: 'error', summary: 'Error', detail: 'Formato de fecha y hora inválido.'
  //     });
  //     return;
  //   }

  //   if (updatedDate < new Date() || updatedDate.getHours() < 9 || updatedDate.getHours() > 17) {
  //     this.messageService.add({
  //       severity: 'error', summary: 'Error', detail: 'La fecha y hora seleccionadas no son válidas. Elija un horario entre las 9:00 AM y las 5:00 PM.'
  //     });
  //     return;
  //   }

  //   const citaToUpdate = this.citasPendientes.find(c => c.citaId === citaId);
  //   if (citaToUpdate) {
  //     citaToUpdate.estado = nuevoEstado;
  //     citaToUpdate.fechaHora = updatedDate;
  //     this.citaService.updateCita(citaToUpdate).subscribe({
  //       next: (response) => {
  //         this.messageService.add({
  //           severity: 'success', summary: 'Éxito', detail: 'Cita actualizada correctamente.'
  //         });
  //         this.loadCitas();
  //       },
  //       error: (error) => {
  //         this.messageService.add({
  //           severity: 'error', summary: 'Error', detail: 'Error al actualizar el estado de la cita.'
  //         });
  //       }
  //     });
  //   } else {
  //     this.messageService.add({
  //       severity: 'error', summary: 'Error', detail: 'Cita no encontrada para actualizar.'
  //     });
  //   }
  // }

  updateEstado(citaId: number, nuevoEstado: string): void {
    this.showLoading = true;

    const citaToUpdate = this.citasPendientes.find(c => c.citaId === citaId);  // Ensure this searches the correct array
    if (citaToUpdate) {
      if(nuevoEstado === 'Rechazada' && !citaToUpdate.motivo){
        this.messageService.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'Por favor ingrese un motivo para rechazar la cita.'
        });
        this.showLoading = false;
        return;
      }
      console.log('cita actualiza: ', citaToUpdate);
      citaToUpdate.estado = nuevoEstado;  // Modify the local copy
      this.citaService.updateCita(citaToUpdate).subscribe({
        next: (response) => {
          console.log('Estado de la cita actualizado', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Cita actualizada',
            detail: `La cita ha sido ${nuevoEstado}`
          })
          this.loadCitas();  // Reload the citas to reflect changes
        },
        error: (error) => {
          console.error('Error al actualizar el estado de la cita', error);
        },
        complete: () =>{
          this.showLoading = false;
        }
      });
    } else {
      console.error('Cita not found for updating');
    }
  }

  navigateToPanel(): void {
    this.router.navigate(['/abogados']); // Asegúrate de usar la ruta correcta aquí
  }

  filtrarCitasPorEstado(): void {
    this.citasPendientes = this.citasAsignadas.filter(c => c.estado === 'Pendiente');
    this.citasAceptadas = this.citasAsignadas.filter(c => c.estado === 'Aceptado');
    this.citasRechazadas = this.citasAsignadas.filter(c => c.estado === 'Rechazada');
  }
}
