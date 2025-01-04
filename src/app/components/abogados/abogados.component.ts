import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CasoDTO } from 'src/app/interfaces/caso';
import { AuthService } from 'src/app/services/auth.service';
import { CrearCasoComponent } from '../crear-caso/crear-caso.component';
import { CasosService } from 'src/app/services/casos.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-abogados',
  templateUrl: './abogados.component.html',
  styleUrls: ['./abogados.component.css']
})
export class AbogadosComponent implements OnInit{
  currentSection: string = 'inicio';
  displayModalCrearCaso: boolean = false;
  casos: CasoDTO[] = [];
  showLoading: boolean = false;
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
    imagenes: [],
    archivos: [],
    nombreArchivo: []
  };

  selectedCasoUser: CasoDTO = this.defaultCaso;


  @ViewChild(CrearCasoComponent) crearCasoComponent!: CrearCasoComponent;

  constructor(private authService: AuthService, private router: Router, private casosService: CasosService){}

  ngOnInit(){
    this.loadCasos();
  }

  setFile(listB64: string[]) {
    console.log("aqui si entra",listB64)
    this.selectedCasoUser.imagenes = listB64;
  }

  resetFile(event: boolean){

  }

  visualizarArchivo(base64Content: string): void {
    const blob = this.base64ToBlob(base64Content, 'application/pdf');
    const url = URL.createObjectURL(blob);
    window.open(url);
  }

  descargarArchivo(base64Content: string, fileName: string): void {
    const blob = this.base64ToBlob(base64Content, 'application/pdf');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'archivo';
    link.click();
    URL.revokeObjectURL(url);
  }

  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  extraerTipoArchivo(archivo: string): string {
    const match = archivo.match(/^data:(.*?);base64,/);
    return match ? match[1] : 'application/octet-stream';  // Si no se encuentra, usa un genérico
  }

  loadCasos(){
    this.showLoading = true;
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

  formularioCaso(){
    this.displayModalCrearCaso = true;
  }

  crearCaso(nuevoCaso: CasoDTO){
    this.casos.push(nuevoCaso);
    this.displayModalCrearCaso = false;
  }

  showCaseDetails(caso: CasoDTO) {
    console.log('caso:', caso);
    this.selectedCaso = caso;
    this.displayModal = true;
  }

  downloadExcel() {
    if (this.selectedCaso) {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([this.selectedCaso]);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Case Details');
      XLSX.writeFile(wb, 'CaseDetails.xlsx');
    }
  }

  downloadPDF() {
    if (this.selectedCaso) {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(18);
      doc.text('Detalles del Caso', 14, 15);

      // Datos a excluir (por ejemplo, IDs)
      const excludedFields = ['casoId', 'abogadoId', 'clienteId', 'citaId'];

      // Mapea los campos que deseas incluir en el PDF
      const data = this.selectedCaso
  ? Object.keys(this.selectedCaso)
      .filter(key => !excludedFields.includes(key))
      .map(key => [key, this.selectedCaso?.[key as keyof CasoDTO] ?? ''])
  : [];

      // Agrega la tabla con los detalles
      autoTable(doc, {
        startY: 25,
        head: [['Campo', 'Valor']],
        body: data.map(row => row.map(item => {
          if (Array.isArray(item)) {
            return item.join(', ');  // Convierte arrays a string
          } else if (item instanceof Date) {
            return item.toLocaleDateString();  // Formatea fechas
          } else {
            return item.toString();  // Convierte cualquier otro tipo a string
          }
        }))
      });

      // Guarda el PDF con un nombre dinámico
      doc.save(`Detalles_Caso_${this.selectedCaso.casoId}.pdf`);
    }
  }

  closeModal() {
    this.displayModal = false;
  }

  editCaso(caso: CasoDTO) {
    this.selectedCasoUser = { ...caso }; // Crear una copia del caso para evitar modificaciones no intencionales
    this.displayEditModal = true;
  }

  updateCaso() {
    console.log('caso:', this.selectedCasoUser);
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

  changeSection(section: string){
    this.currentSection = section;
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
