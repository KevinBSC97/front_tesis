import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CitasComponent } from '../citas/citas.component';
import { CitaDTO } from 'src/app/interfaces/citas';
import { CitasService } from 'src/app/services/citas.service';
import { MessageService } from 'primeng/api';
import { CasoDTO } from 'src/app/interfaces/caso';
import { CasosService } from 'src/app/services/casos.service';

import { FileUpload } from 'src/app/interfaces/file';
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  casos: CasoDTO[] = [];
  selectedCaso: CasoDTO | null = null;
  displayModal: boolean = false;
  displayEditModal: boolean = false;
  archivosBase64: FileUpload = { archivos: [], nombres: [] };

  displaySeguimientoModal = false;
  seguimientoForm!: FormGroup;
  progreso = 0;

  totalCitas: number = 0;
  totalCasos: number = 0;

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
  }

  selectedCasoUser: CasoDTO = this.defaultCaso;

  @ViewChild(CitasComponent) citaComponent!: CitasComponent;

  constructor(private authService: AuthService,
    private router: Router,
    private citasService: CitasService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private casosService: CasosService){

  }

  ngOnInit(): void {
    this.seguimientoForm = this.fb.group({
      observacion: ['', Validators.required],
      progreso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
    this.loadCasos();
    this.cargarCitas();
    this.obtenerTotalCitasCliente();
    this.obtenerTotalCasosCliente();
  }

  setFile(listB64: string[]) {
    console.log("aqui si entra",listB64)
    this.selectedCasoUser.imagenes = listB64;
  }

  uploadFiles(fileUploads: FileUpload) {
    console.log("Archivos cargados en el padre:", fileUploads);
    this.selectedCasoUser.archivos = fileUploads.archivos.map(file => file.content);
    this.selectedCasoUser.nombreArchivo = fileUploads.nombres;
  }

  resetFile(event: boolean){

  }

  updateCaso(){
    if(this.selectedCasoUser){
      this.casosService.updateCaso(this.selectedCasoUser).subscribe(
        () => {
          console.log(this.selectedCasoUser);
          this.displayEditModal = false;
          this.loadCasos();
        },
        error => {
          console.log('Error al actualizar el caso: ', error);
        }
      )
    }
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

  loadCasos(){
    this.loading = true;
    const clienteId = this.authService.getCurrentUser()?.usuarioId;
    if(clienteId){
      this.casosService.getCasosCliente(clienteId).subscribe(
        data => {
          this.casos = data;
        },
        error => {
          console.log('Error al cargar los casos: ', error);
        }
      )
    }
  }

  obtenerTotalCitasCliente(){
    const clienteId = this.authService.getCurrentUser()?.usuarioId;
    if(clienteId){
      this.citasService.getTotalCitasCliente(clienteId).subscribe({
        next: (data) => {
          this.totalCitas = data.cantidadCitas;
        }
      })
    }
  }

  obtenerTotalCasosCliente(){
    const clienteId = this.authService.getCurrentUser()?.usuarioId;
    if(clienteId){
      this.casosService.getTotalCasosCliente(clienteId).subscribe({
        next: (data) => {
          this.totalCasos = data.cantidadCasos;
        }
      })
    }
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

  showCaseDetails(caso: CasoDTO){
    this.selectedCaso = caso;
    this.displayModal = true;
  }

  editCaso(caso: CasoDTO){
    this.selectedCasoUser = { ...caso };
    this.selectedCasoUser.archivos = caso.archivos || [];
    this.selectedCasoUser.nombreArchivo = caso.nombreArchivo || [];
    console.log("Archivos a editar:", this.selectedCasoUser);  // Verifica que los datos estén presentes
    this.displayEditModal = true;
  }

  extraerTipoArchivo(archivo: string): string {
    const match = archivo.match(/^data:(.*?);base64,/);
    return match ? match[1] : 'application/octet-stream';  // Si no se encuentra, usa un genérico
  }

  downloadPDF() {
    if (this.selectedCaso) {
      const doc = new jsPDF();

      // Título del Documento
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Detalles del Caso', 105, 15, { align: "center" });

      // Espaciado inicial
      let startY = 30;

      // Datos a excluir (como IDs)
      const excludedFields = ['casoId', 'abogadoId', 'clienteId', 'citaId', 'imagenes', 'archivos', 'especialidadDescripcion', 'fechaCita', 'nombreArchivo'];

      const fieldMapping: { [key: string]: string } = {
        asunto: 'Asunto',
        descripcion: 'Descripción',
        nombreCliente: 'Cliente',
        nombreAbogado: 'Abogado',
        fechaRegistro: 'Fecha del Caso',
        estado: 'Estado'
      };

      // Formateo y mapeo de los datos
      const data = this.selectedCaso
      ? Object.keys(this.selectedCaso)
          .filter(key => !excludedFields.includes(key))
          .map(key => [
            fieldMapping[key] || key,  // Traducir el campo si existe en el mapeo
            Array.isArray(this.selectedCaso?.[key as keyof CasoDTO])
              ? (this.selectedCaso?.[key as keyof CasoDTO] as string[]).join(', ')
              : this.selectedCaso?.[key as keyof CasoDTO] instanceof Date
                ? (this.selectedCaso?.[key as keyof CasoDTO] as Date).toLocaleDateString()
                : this.selectedCaso?.[key as keyof CasoDTO]?.toString() ?? ''
          ])
      : [];

      // Estilo de la tabla
      autoTable(doc, {
        startY: startY,
        head: [['', 'Detalles']],
        body: data,
        styles: {
          fontSize: 11,
          cellPadding: 3,
          minCellHeight: 10
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 25, left: 15, right: 15 }
      });

      // Obtener finalY directamente de doc.autoTable
      const finalY = (doc as any).autoTable.previous.finalY || startY;

      console.log('finalY: ', finalY);

      // Agregar imágenes después de la tabla
      let imageY = finalY + 10;

      if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
        this.selectedCaso.imagenes.forEach((base64Image: string) => {
          if (base64Image) {
            const imgType = base64Image.split(';')[0].split('/')[1];  // Extrae el tipo de imagen (jpeg, png)
            doc.addImage(base64Image, imgType, 50, imageY, 100, 75);
            imageY += 85;
          }
        });
      }

      console.log(this.selectedCaso);
      // Guarda el PDF con un nombre dinámico
      doc.save(`Detalles_Caso_${this.selectedCaso.casoId}.pdf`);
    }
  }

  setFiles(files: FileUpload) {
      this.archivosBase64 = files;
    }

  closeEditModal(){
    this.displayEditModal = false;
  }

  closeModal(){
    this.displayModal = false;
  }

  transformarArchivos(archivos: string[], nombres: string[]): { name: string; type: string; content: string }[] {
    return archivos.map((archivo, index) => {
      return {
        name: nombres[index] || `Archivo_${index + 1}`,
        type: this.obtenerTipoArchivo(archivo),
        content: archivo  // El contenido en base64 del archivo
      };
    });
  }

  obtenerTipoArchivo(archivo: string): string {
    if (archivo.startsWith('data:')) {
      return archivo.split(';')[0].split(':')[1];  // Extraer el MIME type
    }
    return 'application/octet-stream';  // Tipo genérico si no se puede identificar
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
