import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CasoDTO } from 'src/app/interfaces/caso';
import { AuthService } from 'src/app/services/auth.service';
import { CrearCasoComponent } from '../crear-caso/crear-caso.component';
import { CasosService } from 'src/app/services/casos.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CitasService } from 'src/app/services/citas.service';
import { FileUpload } from 'src/app/interfaces/file';
import { SeguimientoService } from 'src/app/services/seguimiento.service';
import { MessageService } from 'primeng/api';
import { DocumentoService } from 'src/app/services/documento.service';
import { DocumentoDTO } from 'src/app/interfaces/documentos';
import { CitaDTO } from 'src/app/interfaces/citas';

@Component({
  selector: 'app-abogados',
  templateUrl: './abogados.component.html',
  styleUrls: ['./abogados.component.css']
})
export class AbogadosComponent implements OnInit{
  currentSection: string = 'inicio';
  displayModalCrearCaso: boolean = false;
  displayModalCargarDocumento: boolean = false;
  casos: CasoDTO[] = [];
  documentos: DocumentoDTO[] = [];
  showLoading: boolean = false;
  selectedCaso: CasoDTO | null = null;
  displayModal: boolean = false;
  displayEditModal: boolean = false;
  displayModalDocumento: boolean = false;
  displaySeguimientoModal = false;

  searchTextCitas: string = '';
  filteredCitas: CitaDTO[] = [];

  searchTextCasos: string = '';
  filteredCasos: CasoDTO[] = [];

  archivosBase64: FileUpload = { archivos: [], nombres: [] };

  totalCitas: number = 0;
  totalCitasPendientes: number = 0;
  totalCitasAceptadas: number = 0;
  totalCitasRechazadas: number = 0;
  progreso = 0;

  citas: CitaDTO[] = [];

  selectedDocumento: DocumentoDTO | null = null;

  searchTextDocumentos: string = '';
  filteredDocumentos: DocumentoDTO[] = [];

  documentForm!: FormGroup;
  seguimientoForm!: FormGroup;

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

  tiposDocumentos: { label: string; value: string }[] = [];

  @ViewChild(CrearCasoComponent) crearCasoComponent!: CrearCasoComponent;

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private casosService: CasosService,
    private citasService: CitasService,
    private seguimientoService: SeguimientoService,
    private documentoService: DocumentoService,
    private documentosService: DocumentoService,
    private messageService: MessageService){}

  ngOnInit(){
    this.seguimientoForm = this.fb.group({
      observacion: ['', Validators.required],
      progreso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
    this.tiposDocumentos = [
      { label: 'Legal', value: 'legal' },
      { label: 'Leyes', value: 'leyes' },
      { label: 'Contratos', value: 'contratos' },
      { label: 'Otros', value: 'otros' },
    ];
    this.documentForm = this.fb.group({
      nombreDocumento: ['', [Validators.required, Validators.minLength(3)]],
      tipoDocumento: ['', Validators.required]
    });
    this.loadCasos();
    this.loadCitas();
    this.loadDocumentos();
    this.obtenerTotalCitas();
    this.cargarCitasPorEstado();
  }

  setFile(listB64: string[]) {
    console.log("aqui si entra",listB64)
    this.selectedCasoUser.imagenes = listB64;
  }

  resetFile(event: boolean){

  }

  setFiles(files: FileUpload) {
    this.archivosBase64 = files;
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

  loadCitas(){
    const userId = this.authService.getCurrentUser()?.usuarioId;
    if(userId){
      this.citasService.getCitasAsignadas(userId).subscribe({
        next: (data) => {
          this.citas = data;
          this.filteredCitas = [...data]
        }
      })
    }
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
          this.loadCitas();
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

  loadCasos(){
    this.showLoading = true;
    const abogadoId = this.authService.getCurrentUser()?.usuarioId;
    if(abogadoId){
      this.casosService.getCasos(abogadoId).subscribe(
        data => {
          this.casos = data;
          this.filteredCasos = [...data]
        },
        error => {
          console.log('Error al cargar los casos: ', error);
        }
      )
    }
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
        caso.estado.toLowerCase().includes(searchTextLower)
      )
    })
  }

  loadDocumentos(){
    this.documentosService.getDocumentos().subscribe({
      next: (data) => {
        console.log('docs: ', data);
        this.documentos = data;
        this.filteredDocumentos = [...data];
      },
      error: (error) => {
        console.log('error');
      }
    })
  }

  guardarDocumento(event: Event) {
    event.preventDefault(); // Previene el envío del formulario por defecto.

    if (this.documentForm.valid && this.archivosBase64.archivos.length > 0) {
      const documentoData = {
        nombre: this.documentForm.value.nombreDocumento,
        tipo: this.documentForm.value.tipoDocumento,
        contenido: this.archivosBase64.archivos[0].content,
        nombreArchivo: this.archivosBase64.archivos[0].name,
        usuarioId: this.authService.getCurrentUser()?.usuarioId,
      };
      this.documentoService.agregarDocumento(documentoData).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Documento Guardado',
            detail: 'El documento fue guardado exitosamente',
          });
          this.displayModalCargarDocumento = false;
          this.documentForm.reset();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al guardar el documento',
          });
        },
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, complete todos los campos para cargar un archivo',
      });
    }
  }

  filterDocumentos(){
    if(!this.searchTextDocumentos.trim()){
      this.filteredDocumentos = [...this.documentos];
      return;
    }
    const searchTextLower = this.searchTextDocumentos.toLowerCase();
    this.filteredDocumentos = this.documentos.filter((documento) => {
      return(
        documento.nombre.toLowerCase().includes(searchTextLower) ||
        documento.tipo.toLowerCase().includes(searchTextLower)
      )
    })
  }

  visualizarDocumento(documento: DocumentoDTO){
    this.selectedDocumento = documento;
    this.displayModalDocumento = true;
  }

  obtenerTotalCitas(){
    const abogadoId = this.authService.getCurrentUser()?.usuarioId;
    if(abogadoId){
      this.citasService.getTotalCitasAbogado(abogadoId).subscribe({
        next: (data) => {
          console.log('total citas: ', data);
          this.totalCitas = data.cantidadCitas;
        }
      })
    }
  }

  cargarCitasPorEstado() {
    const abogadoId = this.authService.getCurrentUser()?.usuarioId;
    if (abogadoId) {
      this.citasService.getCitasPorEstado(abogadoId).subscribe({
        next: (data) => {
          console.log('Citas por estado:', data);
          this.totalCitasPendientes = data.pendientes;
          this.totalCitasAceptadas = data.aceptadas;
          this.totalCitasRechazadas = data.rechazadas;
        },
        error: (error) => console.log('Error al cargar citas por estado:', error)
      });
    }
  }

  abrirModalSeguimiento(caso: any) {
    this.selectedCasoUser = caso;
    this.progreso = caso.progreso || 0;
    this.seguimientoForm.patchValue({
      observacion: '',
      progreso: this.progreso,
    });
    this.displaySeguimientoModal = true;
  }


  guardarSeguimiento(){
    if(this.seguimientoForm.valid){
      const seguimientoData = {
        casoId: this.selectedCasoUser.casoId,
        usuarioId: this.authService.getCurrentUser()?.usuarioId,
        observacion: this.seguimientoForm.value.observacion,
      };

      this.seguimientoService.agregarSeguimiento(seguimientoData).subscribe({
        next: (response) => {
          // Actualizar el progreso del caso con la respuesta del backend
          this.selectedCasoUser.progreso = response.progreso;

          // Mostrar mensaje de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Seguimiento Guardado',
            detail: `El seguimiento fue guardado exitosamente. El progreso del caso ahora es ${response.progreso}%.`,
          });

          // Cerrar el modal y recargar los datos
          this.displaySeguimientoModal = false;
          this.loadCasos(); // Recargar la lista de casos
        },
        error: (error) => {
          console.error('Error al guardar seguimiento:', error);

          // Mostrar mensaje de error
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al guardar el seguimiento. Intente nuevamente.',
          });
        },
      });
    } else {
      // Validar si el formulario no es válido
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, complete los campos requeridos antes de guardar el seguimiento.',
      });
      // const seguimientoData = {
      //   casoId: this.selectedCasoUser.casoId,
      //   usuarioId: this.authService.getCurrentUser()?.usuarioId,
      //   observacion: this.seguimientoForm.value.observacion,
      //   progreso: this.seguimientoForm.value.progreso
      // };
      // this.seguimientoService.agregarSeguimiento(seguimientoData).subscribe({
      //   next: (response) => {
      //     this.messageService.add({
      //       severity: 'success',
      //       summary: 'Seguimiento Guardado',
      //       detail: 'El seguimiento fue guardado exitosamente',
      //     });
      //     this.displaySeguimientoModal = false;
      //   },
      //   error: (error) => {
      //     this.messageService.add({
      //       severity: 'error',
      //       summary: 'Error',
      //       detail: 'Hubo un problema al guardar el seguimiento',
      //     })
      //   }
      // })
    }
  }

  formularioCaso(){
    this.displayModalCrearCaso = true;
  }

  formularioDocumento(){
    this.displayModalCargarDocumento = true;
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
        let cursorY = 20; // Margen inicial superior

        // Agregar logo del consultorio
        const logoPath = 'assets/image/logo.png';
        const logoX = 15; // Coordenada X del logo
        const logoWidth = 50; // Ancho del logo
        const logoHeight = 20; // Alto del logo
        doc.addImage(logoPath, 'PNG', logoX, cursorY, logoWidth, logoHeight);

        // Título alineado al logo
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const titleX = logoX + logoWidth + 10; // Alinear el título a la derecha del logo
        doc.text('Consultorio Jurídico', titleX, cursorY + 15); // Alineación vertical ajustada
        cursorY += logoHeight + 10;

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
        doc.setFont("helvetica", "normal");
        const details = [
            { label: 'Nombre del Cliente', value: this.selectedCaso.nombreCliente || "No especificado." },
            { label: 'Nombre del Abogado a Cargo', value: this.selectedCaso.nombreAbogado || "No especificado." },
            { label: 'Tipo de Caso', value: this.selectedCaso.asunto || "No especificado." },
            { label: 'Duración del Caso', value: `${this.selectedCaso.duracion || "No especificada."} días` },
            { label: 'Fecha de Finalización del Caso', value: this.selectedCaso.fechaFinalizacion
                ? new Date(this.selectedCaso.fechaFinalizacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : "No especificada." },
        ];

        details.forEach(({ label, value }) => {
            doc.setFont("helvetica", "bold");
            doc.text(`• ${label}:`, 15, cursorY); // Agregar viñeta y texto en negrita
            const textWidth = doc.getTextWidth(`• ${label}: `); // Calcular el ancho de la etiqueta
            doc.setFont("helvetica", "normal");
            doc.text(value, 15 + textWidth, cursorY); // Texto del valor alineado
            cursorY += 10;

            // Verificar si es necesario agregar una nueva página
            if (cursorY > doc.internal.pageSize.height - 20) {
                doc.addPage();
                cursorY = 20;
            }
        });

        // Información de la cita judicial
        doc.setFont("helvetica", "bold");
        doc.text('Información de la Cita Judicial', 15, cursorY);
        cursorY += 10;
        doc.setFont("helvetica", "normal");
        const citaDetails = [
            { label: 'Fecha de la Cita Judicial', value: this.selectedCaso.fechaCita
                ? new Date(this.selectedCaso.fechaCita).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : "No especificada." },
            { label: 'Asunto de la Cita', value: this.selectedCaso.asunto || "No especificado." },
        ];

        citaDetails.forEach(({ label, value }) => {
            doc.setFont("helvetica", "bold");
            doc.text(`• ${label}:`, 15, cursorY); // Agregar viñeta y texto en negrita
            const textWidth = doc.getTextWidth(`• ${label}: `);
            doc.setFont("helvetica", "normal");
            doc.text(value, 15 + textWidth, cursorY); // Texto del valor alineado
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
        doc.text(descripcion, 15, cursorY, { maxWidth: 180 });
        cursorY += 20;

        // Imágenes adjuntas
        if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text('Imágenes Adjuntas', 15, cursorY);
            cursorY += 10;

            this.selectedCaso.imagenes.forEach((base64Image: string) => {
                const imgWidth = 70;
                const imgHeight = 70;

                if (cursorY + imgHeight > doc.internal.pageSize.height) {
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
  //   if (this.selectedCaso) {
  //       const doc = new jsPDF();
  //       let finalY = 30; // Posición inicial después del título

  //       // Título del Documento
  //       doc.setFontSize(20);
  //       doc.setFont("helvetica", "bold");
  //       doc.text('Detalles del Caso', 105, 15, { align: "center" });

  //       // Datos a excluir (como IDs y otros innecesarios)
  //       const excludedFields = ['casoId', 'abogadoId', 'clienteId', 'citaId', 'imagenes', 'archivos', 'especialidadDescripcion', 'fechaCita', 'nombreArchivo'];

  //       const fieldMapping: { [key: string]: string } = {
  //           asunto: 'Asunto',
  //           descripcion: 'Descripción',
  //           nombreCliente: 'Cliente',
  //           nombreAbogado: 'Abogado',
  //           fechaRegistro: 'Fecha del Caso',
  //           estado: 'Estado',
  //           duracion: 'Duracion',
  //           fechaFinalizacion: 'Fecha de finalizacion del caso',
  //           progreso: 'Progreso'
  //       };

  //       // Formateo y mapeo de los datos
  //       const data = this.selectedCaso
  //         ? Object.keys(this.selectedCaso)
  //             .filter(key => !excludedFields.includes(key))
  //             .map(key => [
  //               fieldMapping[key] || key, // Mapea el nombre del campo
  //               (() => {
  //                 const value = this.selectedCaso?.[key as keyof CasoDTO];
  //                 if (key === 'fechaRegistro') {
  //                   // Manejo específico para el campo fechaRegistro
  //                   if (value instanceof Date) {
  //                     return value.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  //                   }
  //                   if (typeof value === 'string') {
  //                     try {
  //                       return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  //                     } catch {
  //                       return value; // Devuelve el valor como está si no se puede convertir
  //                     }
  //                   }
  //                   return ''; // Valor por defecto si no es ni Date ni string
  //                 }
  //                 // Manejo genérico para otros campos
  //                 if (Array.isArray(value)) {
  //                   return value.join(', ');
  //                 }
  //                 return value?.toString() ?? '';
  //               })()
  //             ])
  //         : [];

  //       // Generar tabla con los datos
  //       autoTable(doc, {
  //           startY: finalY,
  //           head: [['Campo', 'Valor']],
  //           body: data,
  //           styles: {
  //               fontSize: 11,
  //               cellPadding: 3,
  //               minCellHeight: 10
  //           },
  //           headStyles: {
  //               fillColor: [41, 128, 185],
  //               textColor: 255,
  //               fontStyle: 'bold'
  //           },
  //           alternateRowStyles: {
  //               fillColor: [245, 245, 245]
  //           },
  //           margin: { top: 25, left: 15, right: 15 },
  //           didDrawPage: (data) => {
  //             finalY = data.cursor?.y ?? 30; // Actualizamos la posición final de la tabla
  //           }
  //       });

  //       // Agregar imágenes
  //       if (this.selectedCaso?.imagenes && this.selectedCaso.imagenes.length > 0) {
  //         let imgY = finalY + 10; // Espacio después de la tabla
  //         this.selectedCaso.imagenes.forEach((base64Image: string) => {
  //           const imgWidth = 50; // Ancho de la imagen
  //           const imgHeight = 50; // Alto de la imagen

  //           // Verificar si la imagen cabe en la página actual
  //           if (imgY + imgHeight > doc.internal.pageSize.height) {
  //             doc.addPage(); // Crear nueva página
  //             imgY = 10; // Reiniciar posición en la nueva página
  //           }

  //           doc.addImage(base64Image, 'JPEG', 15, imgY, imgWidth, imgHeight);
  //           imgY += imgHeight + 10; // Incrementar posición para la siguiente imagen
  //         });
  //       }

  //       // Guardar el PDF con un nombre dinámico
  //       doc.save(`Detalles_Caso_${this.selectedCaso.casoId}.pdf`);
  //   }
  // }

  closeModal() {
    this.displayModal = false;
  }

  transformedArchivos: { name: string; type: string; content: string }[] = [];

  handleFileChanges(event: { archivos: any[]; nombres: string[] }): void {
    // Actualiza `transformedArchivos` para reflejar cambios en la vista
    this.transformedArchivos = event.archivos;

    // Sincroniza los cambios con `selectedCasoUser.archivos`
    this.selectedCasoUser.archivos = this.transformedArchivos.map((file) => file.content); // Base64
    this.selectedCasoUser.nombreArchivo = this.transformedArchivos.map((file) => file.name); // Nombres de los archivos
  }

  editCaso(caso: CasoDTO) {
    this.selectedCasoUser = { ...caso }; // Crear una copia del caso para evitar modificaciones no intencionales
    if (this.selectedCasoUser.archivos && this.selectedCasoUser.archivos.length > 0) {
      this.transformedArchivos = this.selectedCasoUser.archivos.map((archivo, index) => {
        return {
          name: this.selectedCasoUser.nombreArchivo[index] || `Archivo_${index + 1}`, // Usa el nombre si está disponible
          type: archivo.split(';')[0].split(':')[1], // Extrae el tipo MIME del archivo
          content: archivo, // El contenido base64 original
        };
      });
    } else {
      this.transformedArchivos = []; // Inicializa como arreglo vacío si no hay archivos
    }
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
