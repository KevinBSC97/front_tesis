import { MessageService } from 'primeng/api';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from 'src/app/services/usuario.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  loginForm!: FormGroup;
  showLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]]
    });
  }

  onSubmit(){
    if (this.loginForm.valid) {
      this.showLoading = true;
      const email = this.loginForm.value.email;

      this.usuarioService.recuperarPassword(email).subscribe({
        next: (response) => {
          // Verifica si la respuesta contiene el mensaje esperado
          if (response && response.message) {
            this.messageService.add({
              severity: 'success',
              summary: 'Correo enviado',
              detail: response.message
            });
          }
          this.showLoading = false;  // Detener loading en éxito
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          console.error('Error al enviar solicitud', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al enviar el correo.'
          });
          this.showLoading = false;  // Detener loading en error
        }
      });
    }
  }
}
