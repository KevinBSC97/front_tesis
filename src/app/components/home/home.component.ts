import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CitasComponent } from '../citas/citas.component';
import { CitaDTO } from 'src/app/interfaces/citas';
import { CitasService } from 'src/app/services/citas.service';
import { MessageService } from 'primeng/api';
import { CasoDTO, SeguimientoDTO } from 'src/app/interfaces/caso';
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

  searchTextCasos: string = '';
  filteredCasos: CasoDTO[] = [];

  searchTextCitas: string = '';
  filteredCitas: CitaDTO[] = [];

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

  displaySeguimientosModal = false;

  seguimientos: SeguimientoDTO[] = [];

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
        this.filteredCitas = [...data]
        this.loading = false;
      },
      error: (error) => {
        const errorMsg = error.error.message || 'Error al cargar las citas';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg});
        this.loading = false;
      }
    })
  }

  eliminarCita(citaId: number){
    if(confirm('¿Está seguro de que desea eliminar esta cita?')){
      this.citasService.eliminarCita(citaId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Cita eliminada',
            detail: 'La cita fue eliminada correctamente'
          });
          this.cargarCitas();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la cita'
          })
        }
      })
    }
  }

  loadCasos(){
    this.loading = true;
    const clienteId = this.authService.getCurrentUser()?.usuarioId;
    if(clienteId){
      this.casosService.getCasosCliente(clienteId).subscribe(
        data => {
          //this.casos = data;
          this.casos = data.map(caso => ({
            ...caso,
            seguimientos: caso.seguimientos || [] // Asegúrate de inicializar seguimientos como array si es null o undefined
          }));
          this.filteredCasos = [...data]
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
    this.filteredCitas.push(nuevaCita);
    this.messageService.add({severity:'success', summary:'Éxito', detail:'Cita creada exitosamente'})
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
    //this.selectedCaso = caso;
    this.selectedCaso = {
      ...caso,
      imagenes: caso.imagenes?.filter(imagen => imagen.trim() !== '') ?? [],
      archivos: caso.archivos?.filter(archivo => archivo.trim() !== '') ?? []
    }
    this.displayModal = true;
  }

  editCaso(caso: CasoDTO){
    this.selectedCasoUser = { ...caso };
    this.selectedCasoUser.archivos = caso.archivos || [];
    this.selectedCasoUser.nombreArchivo = caso.nombreArchivo || [];
    console.log("Archivos a editar:", this.selectedCasoUser);  // Verifica que los datos estén presentes
    this.displayEditModal = true;
  }

  filterCasos() {
    if(!this.searchTextCasos.trim()){
      this.filteredCasos = [...this.casos];
      return;
    }

    const searchTextLower = this.searchTextCasos.toLowerCase();
    this.filteredCasos = this.casos.filter((caso) => {
      return(
        caso.asunto.toLowerCase().includes(searchTextLower) ||
        caso.nombreCliente.toLowerCase().includes(searchTextLower) ||
        caso.nombreAbogado.toLowerCase().includes(searchTextLower) ||
        caso.estado.toLowerCase().includes(searchTextLower) ||
        caso.tipoCaso?.toLowerCase().includes(searchTextLower)
      )
    })
  }

  filterCitas(): void{
    if(!this.searchTextCitas.trim()){
      this.filteredCitas = [...this.citas];
      return;
    }

    const searchTextLower = this.searchTextCitas.toLowerCase();
    this.filteredCitas = this.citas.filter((cita) => {
      return(
        cita.descripcion.toLowerCase().includes(searchTextLower) ||
        cita.nombreAbogado?.toLowerCase().includes(searchTextLower) ||
        cita.nombreCliente?.toLowerCase().includes(searchTextLower) ||
        cita.estado.toLowerCase().includes(searchTextLower)
      );
    })
  }

  showSeguimientos(caso: CasoDTO): void {
    if (caso.seguimientos && caso.seguimientos.length > 0) {
      this.seguimientos = caso.seguimientos;
      this.displaySeguimientosModal = true; // Variable para mostrar el modal
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin Seguimientos',
        detail: 'Este caso no tiene seguimientos registrados.',
      });
    }
  }

  extraerTipoArchivo(archivo: string): string {
    const match = archivo.match(/^data:(.*?);base64,/);
    return match ? match[1] : 'application/octet-stream';  // Si no se encuentra, usa un genérico
  }

  downloadPDF() {
        if (this.selectedCaso) {
            const doc = new jsPDF();
            let cursorY = 20;

            // Logo del consultorio
            const logoPath = 'assets/image/logo.png';
            doc.addImage(logoPath, 'PNG', 15, cursorY, 50, 20);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text('Consultorio Jurídico', 80, cursorY + 15);
            cursorY += 35;

            // Fecha de registro
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            const fechaRegistro = this.selectedCaso.fechaRegistro
                ? new Date(this.selectedCaso.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : "No especificada.";
            doc.text(`Fecha Registro: ${fechaRegistro}`, 15, cursorY);
            cursorY += 15;

            // Detalles del caso
            doc.setFont("helvetica", "bold");
            doc.text('Detalles del Caso', 15, cursorY);
            cursorY += 10;

            const details = [
                { label: 'Nombre del Cliente', value: this.selectedCaso.nombreCliente || "No especificado." },
                { label: 'Nombre del Abogado a Cargo', value: this.selectedCaso.nombreAbogado || "No especificado." },
                { label: 'Tipo de Caso', value: this.selectedCaso.tipoCaso || "No especificado." },
                { label: 'Duración del Caso', value: `${this.selectedCaso.duracion || "No especificada."} días` },
                { label: 'Fecha de Finalización del Caso', value: this.selectedCaso.fechaFinalizacion
                    ? new Date(this.selectedCaso.fechaFinalizacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : "No especificada." },
            ];

            details.forEach(({ label, value }) => {
                doc.setFont("helvetica", "bold");
                doc.text(`• ${label}:`, 15, cursorY);
                const textWidth = doc.getTextWidth(`• ${label}: `);
                doc.setFont("helvetica", "normal");
                doc.text(value, 15 + textWidth, cursorY);
                cursorY += 10;

                if (cursorY > doc.internal.pageSize.height - 20) {
                    doc.addPage();
                    cursorY = 20;
                }
            });

            // Descripción del caso
            doc.setFont("helvetica", "bold");
            doc.text('Descripción del Caso', 15, cursorY);
            cursorY += 10;
            doc.setFont("helvetica", "normal");
            const descripcion = this.selectedCaso.descripcion || "No especificada.";
            const splitDescripcion = doc.splitTextToSize(descripcion, 180);
            doc.text(splitDescripcion, 15, cursorY);
            cursorY += splitDescripcion.length * 7 + 10;

            // Observaciones
            if (this.selectedCaso.seguimientos && this.selectedCaso.seguimientos.length > 0) {
                doc.setFont("helvetica", "bold");
                doc.text('Observaciones', 15, cursorY);
                cursorY += 10;

                this.selectedCaso.seguimientos.forEach((seguimiento: any, index: number) => {
                    doc.setFont("helvetica", "normal");

                    const observacion = `Observación ${index + 1}: ${seguimiento.observacion}`;
                    const progreso = `Progreso: ${seguimiento.progreso}%`;
                    const fechaRegistro = `Fecha: ${new Date(seguimiento.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

                    if (cursorY + 25 > doc.internal.pageSize.height - 20) {
                        doc.addPage();
                        cursorY = 20;
                    }

                    doc.text(observacion, 15, cursorY, { maxWidth: 180 });
                    cursorY += 7;

                    doc.text(progreso, 15, cursorY, { maxWidth: 180 });
                    cursorY += 7;

                    doc.text(fechaRegistro, 15, cursorY, { maxWidth: 180 });
                    cursorY += 10;
                });
            } else {
                if (cursorY + 10 > doc.internal.pageSize.height - 20) {
                    doc.addPage();
                    cursorY = 20;
                }

                doc.setFont("helvetica", "bold");
                doc.text('Observaciones', 15, cursorY);
                cursorY += 10;

                doc.setFont("helvetica", "normal");
                doc.text('No hay observaciones registradas.', 15, cursorY);
                cursorY += 20;
            }

            // Imágenes adjuntas
            if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
                doc.setFont("helvetica", "bold");
                doc.text('Imágenes Adjuntas', 15, cursorY);
                cursorY += 10;

                this.selectedCaso.imagenes.forEach((base64Image: string) => {
                    const imgWidth = 70;
                    const imgHeight = 70;

                    if (cursorY + imgHeight > doc.internal.pageSize.height - 20) {
                        doc.addPage();
                        cursorY = 20;
                    }

                    doc.addImage(base64Image, 'JPEG', 15, cursorY, imgWidth, imgHeight);
                    cursorY += imgHeight + 10;
                });
            } else {
                doc.setFont("helvetica", "normal");
                doc.text('No hay imágenes adjuntas para este caso.', 15, cursorY);
            }

            // Guardar el PDF
            doc.save(`Informe_Caso_${this.selectedCaso.casoId}.pdf`);
        }
      }

  // downloadPDF() {
  //     if (this.selectedCaso) {
  //         const doc = new jsPDF();
  //         let cursorY = 20;

  //         // Logo del consultorio
  //         const logoPath = 'assets/image/logo.png';
  //         doc.addImage(logoPath, 'PNG', 15, cursorY, 50, 20);
  //         doc.setFontSize(16);
  //         doc.setFont("helvetica", "bold");
  //         doc.text('Consultorio Jurídico', 80, cursorY + 15);
  //         cursorY += 35;

  //         // Fecha de registro
  //         doc.setFontSize(12);
  //         doc.setFont("helvetica", "normal");
  //         const fechaRegistro = this.selectedCaso.fechaRegistro
  //             ? new Date(this.selectedCaso.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  //             : "No especificada.";
  //         doc.text(`Fecha Registro: ${fechaRegistro}`, 15, cursorY);
  //         cursorY += 15;

  //         // Detalles del caso
  //         doc.setFont("helvetica", "bold");
  //         doc.text('Detalles del Caso', 15, cursorY);
  //         cursorY += 10;

  //         const details = [
  //             { label: 'Nombre del Cliente', value: this.selectedCaso.nombreCliente || "No especificado." },
  //             { label: 'Nombre del Abogado a Cargo', value: this.selectedCaso.nombreAbogado || "No especificado." },
  //             { label: 'Tipo de Caso', value: this.selectedCaso.tipoCaso || "No especificado." },
  //             { label: 'Duración del Caso', value: `${this.selectedCaso.duracion || "No especificada."} días` },
  //             { label: 'Fecha de Finalización del Caso', value: this.selectedCaso.fechaFinalizacion
  //                 ? new Date(this.selectedCaso.fechaFinalizacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  //                 : "No especificada." },
  //         ];

  //         details.forEach(({ label, value }) => {
  //             doc.setFont("helvetica", "bold");
  //             doc.text(`• ${label}:`, 15, cursorY);
  //             const textWidth = doc.getTextWidth(`• ${label}: `);
  //             doc.setFont("helvetica", "normal");
  //             doc.text(value, 15 + textWidth, cursorY);
  //             cursorY += 10;

  //             if (cursorY > doc.internal.pageSize.height - 20) {
  //                 doc.addPage();
  //                 cursorY = 20;
  //             }
  //         });

  //         // Descripción del caso
  //         doc.setFont("helvetica", "bold");
  //         doc.text('Descripción del Caso', 15, cursorY);
  //         cursorY += 10;
  //         doc.setFont("helvetica", "normal");
  //         const descripcion = this.selectedCaso.descripcion || "No especificada.";
  //         doc.text(descripcion, 15, cursorY, { maxWidth: 180 });
  //         cursorY += 20;

  //         // Observaciones
  //         if (this.selectedCaso.seguimientos && this.selectedCaso.seguimientos.length > 0) {
  //             doc.setFont("helvetica", "bold");
  //             doc.text('Observaciones', 15, cursorY);
  //             cursorY += 10;

  //             this.selectedCaso.seguimientos.forEach((seguimiento: any, index: number) => {
  //                 doc.setFont("helvetica", "normal");
  //                 const observacion = `Observación ${index + 1}: ${seguimiento.observacion}`;
  //                 const progreso = `Progreso: ${seguimiento.progreso}%`;
  //                 const fechaRegistro = `Fecha: ${new Date(seguimiento.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  //                 doc.text(observacion, 15, cursorY);
  //                 cursorY += 7;
  //                 doc.text(progreso, 15, cursorY);
  //                 cursorY += 7;
  //                 doc.text(fechaRegistro, 15, cursorY);
  //                 cursorY += 10;

  //                 if (cursorY > doc.internal.pageSize.height - 20) {
  //                     doc.addPage();
  //                     cursorY = 20;
  //                 }
  //             });
  //         } else {
  //             doc.text('No hay observaciones registradas.', 15, cursorY);
  //             cursorY += 20;
  //         }

  //         // Imágenes adjuntas
  //         if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
  //             doc.setFont("helvetica", "bold");
  //             doc.text('Imágenes Adjuntas', 15, cursorY);
  //             cursorY += 10;

  //             this.selectedCaso.imagenes.forEach((base64Image: string) => {
  //                 const imgWidth = 70;
  //                 const imgHeight = 70;

  //                 if (cursorY + imgHeight > doc.internal.pageSize.height) {
  //                     doc.addPage();
  //                     cursorY = 20;
  //                 }

  //                 doc.addImage(base64Image, 'JPEG', 15, cursorY, imgWidth, imgHeight);
  //                 cursorY += imgHeight + 10;
  //             });
  //         } else {
  //             doc.setFont("helvetica", "normal");
  //             doc.text('No hay imágenes adjuntas para este caso.', 15, cursorY);
  //         }

  //         // Guardar el PDF
  //         doc.save(`Informe_Caso_${this.selectedCaso.casoId}.pdf`);
  //     }
  //   }

  // downloadPDF() {
  //   if (this.selectedCaso) {
  //     const doc = new jsPDF();

  //     // Título del Documento
  //     doc.setFontSize(20);
  //     doc.setFont("helvetica", "bold");
  //     doc.text('Detalles del Caso', 105, 15, { align: "center" });

  //     // Espaciado inicial
  //     let startY = 30;

  //     // Datos a excluir (como IDs)
  //     const excludedFields = ['casoId', 'abogadoId', 'clienteId', 'citaId', 'imagenes', 'archivos', 'especialidadDescripcion', 'fechaCita', 'nombreArchivo'];

  //     const fieldMapping: { [key: string]: string } = {
  //       asunto: 'Asunto',
  //       descripcion: 'Descripción',
  //       nombreCliente: 'Cliente',
  //       nombreAbogado: 'Abogado',
  //       fechaRegistro: 'Fecha del Caso',
  //       estado: 'Estado'
  //     };

  //     // Formateo y mapeo de los datos
  //     const data = this.selectedCaso
  //     ? Object.keys(this.selectedCaso)
  //         .filter(key => !excludedFields.includes(key))
  //         .map(key => [
  //           fieldMapping[key] || key,  // Traducir el campo si existe en el mapeo
  //           Array.isArray(this.selectedCaso?.[key as keyof CasoDTO])
  //             ? (this.selectedCaso?.[key as keyof CasoDTO] as string[]).join(', ')
  //             : this.selectedCaso?.[key as keyof CasoDTO] instanceof Date
  //               ? (this.selectedCaso?.[key as keyof CasoDTO] as Date).toLocaleDateString()
  //               : this.selectedCaso?.[key as keyof CasoDTO]?.toString() ?? ''
  //         ])
  //     : [];

  //     // Estilo de la tabla
  //     autoTable(doc, {
  //       startY: startY,
  //       head: [['', 'Detalles']],
  //       body: data,
  //       styles: {
  //         fontSize: 11,
  //         cellPadding: 3,
  //         minCellHeight: 10
  //       },
  //       headStyles: {
  //         fillColor: [41, 128, 185],
  //         textColor: 255,
  //         fontStyle: 'bold'
  //       },
  //       alternateRowStyles: {
  //         fillColor: [245, 245, 245]
  //       },
  //       margin: { top: 25, left: 15, right: 15 }
  //     });

  //     // Obtener finalY directamente de doc.autoTable
  //     const finalY = (doc as any).autoTable.previous.finalY || startY;

  //     console.log('finalY: ', finalY);

  //     // Agregar imágenes después de la tabla
  //     let imageY = finalY + 10;

  //     if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
  //       this.selectedCaso.imagenes.forEach((base64Image: string) => {
  //         if (base64Image) {
  //           const imgType = base64Image.split(';')[0].split('/')[1];  // Extrae el tipo de imagen (jpeg, png)
  //           doc.addImage(base64Image, imgType, 50, imageY, 100, 75);
  //           imageY += 85;
  //         }
  //       });
  //     }

  //     console.log(this.selectedCaso);
  //     // Guarda el PDF con un nombre dinámico
  //     doc.save(`Detalles_Caso_${this.selectedCaso.casoId}.pdf`);
  //   }
  // }

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
