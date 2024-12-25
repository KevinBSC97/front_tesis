import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CitasComponent } from '../citas/citas.component';
import { CitaDTO } from 'src/app/interfaces/citas';
import { CitasService } from 'src/app/services/citas.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentSection: string = 'inicio';
  displayModalCrearCita: boolean = false;
  citas: CitaDTO[] = [];
  loading: boolean = true;

  @ViewChild(CitasComponent) citaComponent!: CitasComponent;

  constructor(private authService: AuthService, private router: Router, private citasService: CitasService, private messageService: MessageService){

  }

  ngOnInit(): void {
    this.cargarCitas();
  }

  cargarCitas(){
    const clienteId = this.obtenerClienteId();
    this.citasService.getCitasClientes(clienteId).subscribe({
      next: (data) => {
        console.log('data: ', data);
        this.citas = data;
        this.loading = false;
      },
      error: (error) => {
        const errorMsg = error.error.message || 'Error al cargar las citas';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg});
        this.loading = false;
      }
    })
  }

  formularioCita(){
    this.displayModalCrearCita = true;
    this.citaComponent.resetForm();
  }

  crearCita(nuevaCita: CitaDTO){
    this.citas.push(nuevaCita);
    this.displayModalCrearCita = false;
  }

  changeSection(section: string){
    this.currentSection = section;
  }

  obtenerClienteId(): number {
    const usuario = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log(usuario);
    return usuario?.usuarioId || 0;
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
