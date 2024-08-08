import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  notificacionesCount: number = 0;

  constructor(private router: Router, private authService: AuthService, private notificacionService: NotificacionesService) {
    this.preventBackButton();
  }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.username = user ? `${user.nombreUsuario}` : 'Invitado';  // Actualiza el nombre de usuario basado en el estado actual del login
      //this.loadNotificaciones();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.displaySidebar = !this.displaySidebar;
  }

  preventBackButton() {
    history.pushState("", "", location.href);
    window.onpopstate = () => {
      history.go(1);
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
      }
    };
  }

  onNotificationClick() {
    // Manejo de clic en notificación
  }
}
