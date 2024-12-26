import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CasoDTO } from 'src/app/interfaces/caso';
import { CitaDTO } from 'src/app/interfaces/citas';
import { AuthService } from 'src/app/services/auth.service';
import { CasosService } from 'src/app/services/casos.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-casos-realizados',
  templateUrl: './casos-realizados.component.html',
  styleUrls: ['./casos-realizados.component.css']
})
export class CasosRealizadosComponent {
  casos: CasoDTO[] = [];
  selectedCaso: CasoDTO | null = null;
  displayModal: boolean = false;
  displayEditModal: boolean = false;

  defaultCaso: CasoDTO = {
    casoId: 0,
    descripcion: '',
    asunto: '',
    estado: '',
    abogadoId: 0,
    clienteId: 0,
    citaId: 0,
    especialidadDescripcion: '',
    nombreCliente: '',
    fechaCita: new Date(),
    nombreAbogado: '',
    imagenes: []
  };

  selectedCasoUser: CasoDTO = this.defaultCaso;

  constructor(private casosService: CasosService, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadCasos();
  }

  setFile(listB64: string[]) {
    console.log("aqui si entra",listB64)
    this.selectedCasoUser.imagenes = listB64;
  }

  resetFile(event: boolean){

  }

  loadCasos() {
    const abogadoId = this.authService.getCurrentUser()?.usuarioId;
    if(abogadoId){
      this.casosService.getCasos(abogadoId).subscribe(
        data => {
          this.casos = data;
        },
        error => {
          console.log('Error al cargar los casos: ', error);
        }
      )
    }
  }

  showCaseDetails(caso: CasoDTO) {
    this.selectedCaso = caso;
    this.displayModal = true;
  }

  closeModal() {
    this.displayModal = false;
  }

  navigateToPanel() {
    this.router.navigate(['/abogados']);
  }

  downloadExcel() {
    if (this.selectedCaso) {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([this.selectedCaso]);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Case Details');
      XLSX.writeFile(wb, 'CaseDetails.xlsx');
    }
  }

  editCaso(caso: CasoDTO) {

    console.log("edit",caso)
    this.selectedCasoUser = { ...caso }; // Crear una copia del caso para evitar modificaciones no intencionales
    this.displayEditModal = true;
  }

  updateCaso() {
    if (this.selectedCasoUser) {
      this.casosService.updateCaso(this.selectedCasoUser).subscribe(
        () => {
          this.displayEditModal = false;
          this.loadCasos();
        },
        error => {
          console.error('Error al actualizar el caso:', error);
        }
      );
    }
  }

  closeEditModal(){
    this.displayEditModal = false;
  }
}
