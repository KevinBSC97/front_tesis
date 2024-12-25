import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CasoDTO } from 'src/app/interfaces/caso';
import { AuthService } from 'src/app/services/auth.service';
import { CrearCasoComponent } from '../crear-caso/crear-caso.component';
import { CasosService } from 'src/app/services/casos.service';

@Component({
  selector: 'app-abogados',
  templateUrl: './abogados.component.html',
  styleUrls: ['./abogados.component.css']
})
export class AbogadosComponent implements OnInit{
  currentSection: string = 'inicio';
  displayModalCrearCaso: boolean = false;
  casos: CasoDTO[] = [];

  @ViewChild(CrearCasoComponent) crearCasoComponent!: CrearCasoComponent;

  constructor(private authService: AuthService, private router: Router, private casosService: CasosService){}

  ngOnInit(){
    this.loadCasos();
  }

  loadCasos(){
    this.casosService.getCasos().subscribe(
      data => {
        this.casos = data;
      },
      error => {
        console.log('Error al cargar los casos: ', error);
      }
    )
  }

  formularioCaso(){
    this.displayModalCrearCaso = true;
  }

  crearCaso(nuevoCaso: CasoDTO){
    this.casos.push(nuevoCaso);
    this.displayModalCrearCaso = false;
  }

  changeSection(section: string){
    this.currentSection = section;
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
