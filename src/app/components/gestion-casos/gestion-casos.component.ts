import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CasoDTO } from 'src/app/interfaces/caso';
import { CasosService } from 'src/app/services/casos.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-gestion-casos',
  templateUrl: './gestion-casos.component.html',
  styleUrls: ['./gestion-casos.component.css']
})
export class GestionCasosComponent {
  casos: CasoDTO[] = [];
  selectedCaso: CasoDTO | null = null;
  displayModal: boolean = false;

  constructor(private router: Router, private casosService: CasosService) {}

  ngOnInit() {
    this.loadCasos();
  }

  navigateToPanel() {
    this.router.navigate(['/home']);
  }

  showCaseDetails(caso: CasoDTO) {
    this.selectedCaso = caso;
    this.displayModal = true;
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

  closeModal() {
    this.displayModal = false;
  }

  downloadExcel() {
    if (this.selectedCaso) {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([this.selectedCaso]);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Case Details');
      XLSX.writeFile(wb, 'CaseDetails.xlsx');
    }
  }
}
