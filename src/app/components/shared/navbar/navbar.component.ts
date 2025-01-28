import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacionDTO } from 'src/app/interfaces/notificacion';
import { AuthService } from 'src/app/services/auth.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  username: string = 'Invitado';  // Valor por defecto para cuando no hay usuario logueado
  displaySidebar: boolean = false;
  notificaciones: NotificacionDTO[] = [];
  notificacionesNoLeidas: number = 0;

  constructor(private router: Router, private authService: AuthService, private notificacionService: NotificacionesService) {

  }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.username = user ? `${user.nombreUsuario}` : 'Invitado';  // Actualiza el nombre de usuario basado en el estado actual del login
      if(user){
        this.cargarNotificaciones(user.usuarioId);
        this.cargarRecordatorios(user.usuarioId);
        this.cargarRecordatoriosAdministrador();
        this.cargarRecordatoriosCasosPendientes();
        this.cargarNotificacionProgresoCasos();
      }
      //this.loadNotificaciones();
    });
  }

  cargarNotificaciones(usuarioId: number){
    this.notificacionService.getNotificacionesPorUsuario(usuarioId).subscribe({
      next: (notificaciones) => {
        this.notificaciones = notificaciones;
        this.notificacionesNoLeidas = notificaciones.filter((n) => !n.leida).length;
      },
      error: (error) => console.log('Error al obtener las notificaciones: ', error)
    });
  }

  cargarRecordatorios(usuarioId: number) {
    this.notificacionService.getRecordatoriosPendientes(usuarioId).subscribe({
      next: (recordatorios) => {
        // Agregar recordatorios como notificaciones
        this.notificaciones = [...this.notificaciones, ...recordatorios];
        this.notificacionesNoLeidas += recordatorios.length;
      },
      error: (error) => console.log('Error al obtener recordatorios: ', error),
    });
  }

  cargarRecordatoriosAdministrador() {
    this.notificacionService.getRecordatoriosParaAdministradores().subscribe({
      next: (recordatorios) => {
        this.notificaciones = [...this.notificaciones, ...recordatorios];
        this.notificacionesNoLeidas += recordatorios.length;
      },
      error: (error) => console.log('Error al obtener recordatorios para administradores: ', error),
    });
  }

  cargarRecordatoriosCasosPendientes(){
    this.notificacionService.getRecordatorioCasosPendientes().subscribe({
      next: (casosPendientes) => {
        console.log(casosPendientes);
        this.notificaciones = [...this.notificaciones, ...casosPendientes];
        this.notificacionesNoLeidas += casosPendientes.length;
      },
      error: (error) => console.log('Error al obtener recordatorios de casos pendientes: ', error),
    })
  }

  cargarNotificacionProgresoCasos(){
    this.notificacionService.getNotificarProgresoCaso().subscribe({
      next: (progresoCasos) => {
        console.log('progreso: ', progresoCasos);
        this.notificaciones = [...this.notificaciones, ...progresoCasos];
        this.notificacionesNoLeidas += progresoCasos.length;
      },
      error: (error) => console.log('Error al cargar los progresos de los casos. ', error),
    })
  }

  marcarComoLeida(notificacion: NotificacionDTO){
    if(!notificacion.leida){
      this.notificacionService.marcarNotificacionComoLeida(notificacion.notificacionId).subscribe({
        next: () => {
          notificacion.leida = true;
          this.notificacionesNoLeidas = this.notificaciones.filter((n) => !n.leida).length;
        },
        error: (error) => console.log('Error al marcar como leida: ', error)
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.displaySidebar = !this.displaySidebar;
  }
}
