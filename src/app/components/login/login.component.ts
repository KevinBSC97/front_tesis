import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });

    this.authService.logout()
  }

  onLogin() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const loginData = {
      NombreUsuario: this.loginForm.get('username')?.value,
      Contraseña: this.loginForm.get('password')?.value
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
    this.showLoading = false;
    this.messageService.add({
      key: 'login',
      severity: 'error',
      summary: 'Error de acceso',
      detail: 'Credenciales incorrectas o problemas de conexión'
    });
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
      this.messageService.add({
        key: 'login',
        severity: 'error',
        summary: 'Error',
        detail: 'El usuario no se encuentra registrado'
      });
    }
  }

  get usernameControl() { return this.loginForm.get('username'); }
  get passwordControl() { return this.loginForm.get('password'); }
}
