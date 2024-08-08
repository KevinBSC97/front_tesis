import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CasoDTO } from 'src/app/interfaces/caso';
import { CitaDTO } from 'src/app/interfaces/citas';
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
    nombreAbogado: ''
  };

  selectedCasoUser: CasoDTO = this.defaultCaso;

  constructor(private casosService: CasosService, private router: Router) {}

  ngOnInit() {
    this.loadCasos();
  }

  loadCasos() {
    this.casosService.getCasos().subscribe(
      data => {
        this.casos = data;
      },
      error => {
        console.error('Error al cargar los casos:', error);
      }
    );
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
    this.selectedCasoUser = { ...caso }; // Crear una copia del caso para evitar modificaciones no intencionales
    this.displayEditModal = true;
  }

  updateCaso() {
    if (this.selectedCasoUser) {
      this.casosService.updateCaso(this.selectedCasoUser).subscribe(
        () => {
          this.displayEditModal = false;
          this.loadCasos(); // Recargar la lista de casos después de la actualización
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
