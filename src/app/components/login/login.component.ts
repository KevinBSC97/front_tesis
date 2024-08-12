import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginDTO } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  showLoading: boolean = false;
  constructor(private router: Router, private authService: AuthService) {}

  onLogin(form: NgForm) {
    if (!form.valid) {
      this.showAlert('Debe completar los campos para poder ingresar.');
      return;
    }

    const loginData = {
      NombreUsuario: this.username,
      Contraseña: this.password
    };

    this.showLoading = true;
    this.authService.login(loginData).subscribe({
      next: (response) => this.handleLoginSuccess(response),
      error: (error) => this.handleLoginError(error),
      complete:() => {
        this.showLoading = false;
      }
    });
  }

  private handleLoginSuccess(response: any) {
    this.authService.setSession(response);
    const role = response.usuario.rol.descripcion as 'Admin' | 'Cliente' | 'Abogado';
    this.redirectUser(role);
  }

  private handleLoginError(error: any) {
    console.error('Error during login:', error);
    this.showAlert('Credenciales incorrectas o problemas de conexión.');
  }

  private redirectUser(role: 'Admin' | 'Cliente' | 'Abogado') {
    const routes: { [key in 'Admin' | 'Cliente' | 'Abogado']: string } = {
      Admin: '/admin',
      Cliente: '/home',
      Abogado: '/abogados'
    };

    const route = routes[role];
    if (route) {
      this.router.navigate([route], { replaceUrl: true });
    } else {
      this.showAlert('El usuario no se encuentra registrado');
    }
  }

  private showAlert(message: string) {
    alert(message);
  }
}
