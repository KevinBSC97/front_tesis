import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CasoDTO, SeguimientoDTO } from 'src/app/interfaces/caso';
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
  displaySeguimientosModal = false;
  displayEditModalDocumento: boolean = false;
  displayModalProrroga: boolean = false;

  seguimientos: SeguimientoDTO[] = [];

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

  selectedDocumento: DocumentoDTO = {
    contenido: '',
    documentoId: 0,
    fechaCreacion: new Date(),
    nombre: '',
    nombreArchivo: '',
    tipo: '',
    usuarioId: 0,
  };

  searchTextDocumentos: string = '';
  filteredDocumentos: DocumentoDTO[] = [];

  documentForm!: FormGroup;
  seguimientoForm!: FormGroup;
  prorrogaForm!: FormGroup;

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

  transformedArchivo: { name: string; type: string; content: string }[] = []

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
      { label: 'Legal', value: 'Legal' },
      { label: 'Leyes', value: 'Leyes' },
      { label: 'Contratos', value: 'Contratos' },
      { label: 'Otros', value: 'Otros' },
    ];
    this.documentForm = this.fb.group({
      nombreDocumento: ['', [Validators.required, Validators.minLength(3)]],
      tipoDocumento: ['', Validators.required]
    });
    this.prorrogaForm = this.fb.group({
      observacion: ['', Validators.required]
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

  eliminarCita(cita: CitaDTO){
    const fechaCita = new Date(cita.fechaHora);
    const ahora = new Date();

    if((cita.estado !== 'Pendiente' && fechaCita > ahora) || cita.estado !== 'Rechazada'){
      this.messageService.add({
        severity: 'warn',
        summary: 'No permitido',
        detail: 'Solo se pueden eliminar citas en estado Pendiente o Rechazada y su fecha ya ha vencido'
      });
      return;
    }
    if(confirm('¿Está seguro de que desea eliminar esta cita?')){
      this.citasService.eliminarCita(cita.citaId).subscribe({
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

  editDocumento(documento: any): void {
    if (!documento) return; // Si el documento es null o undefined, salir del método

    this.selectedDocumento = { ...documento };

    // Transforma el archivo actual para `shared-upload-file`
    if (this.selectedDocumento?.contenido) {
      this.transformedArchivo = [
        {
          name: this.selectedDocumento.nombreArchivo ?? "Archivo sin nombre",
          type: this.selectedDocumento.contenido.split(";")[0]?.split(":")[1] ?? "application/octet-stream",
          content: this.selectedDocumento.contenido,
        },
      ];
      console.log('archivo: ', this.transformedArchivo);
    } else {
      this.transformedArchivo = [];
    }

    this.displayEditModalDocumento = true;
  }

  updateDocumento(): void {
    if (this.selectedDocumento) {
      this.documentosService.updateDocumento(this.selectedDocumento.documentoId, this.selectedDocumento).subscribe({
        next: (response) => {
          console.log(response);
          this.messageService.add({
            severity: 'success',
            summary: 'Documento Actualizado',
            detail: 'El documento ha sido actualizado correctamente.',
          });
          this.displayEditModalDocumento = false;
          this.loadDocumentos(); // Recargar la lista de documentos actualizada
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al actualizar el documento.',
          });
          console.error(err);
        },
      });
    }
  }

  closeEditModalDocumento() {
    this.displayEditModalDocumento = false;
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
          this.loadDocumentos();
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

  abrirModalProrroga(caso: any) {
    if (!this.isFechaFinalizacionHoy(caso.fechaFinalizacion ?? null) || caso.estado === 'Cerrado') {
      this.messageService.add({
        severity: 'warn',
        summary: 'No se puede solicitar prórroga',
        detail: 'Solo puedes solicitar prórroga si el caso no ha sido cerrado en la fecha de finalización.',
      });
      return;
    }
    this.selectedCasoUser = caso;
    this.prorrogaForm.patchValue({
      observacion: '',
    });
    this.displayModalProrroga = true;
  }

  guardarProrroga(){
    if(this.prorrogaForm.valid){
      const prorrogaData = {
        casoId: this.selectedCasoUser?.casoId,
        observacion: this.prorrogaForm.value.observacion
      };

      if(!prorrogaData.casoId){
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se puede identificar el caso.'
        });
        return;
      }

      const mensaje = `El caso '${this.selectedCasoUser?.asunto}' ya ha cumplido con su fecha de cierre, por tal motivo ${prorrogaData.observacion}`;

      if(!mensaje || mensaje.trim() === ''){
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'El mensaje no se generó correctamente'
        });
        return;
      }

      this.seguimientoService.notificarProrroga(prorrogaData.casoId, mensaje).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Solicitud Enviada',
            detail: 'Se notificó al administrador sobre la solicitud de prórroga para el caso.',
          });
          this.displayModalProrroga = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al enviar la notificación',
          });
        }
      })
    }
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
    this.filteredCasos.push(nuevoCaso);
    this.displayModalCrearCaso = false;
  }

  showCaseDetails(caso: CasoDTO) {
    console.log('caso:', caso);
    console.log('Archivos adjuntos:', this.selectedCaso?.archivos);
    //this.selectedCaso = caso;
    this.selectedCaso = {
      ...caso,
      imagenes: caso.imagenes?.filter(imagen => imagen.trim() !== '') ?? [],
      archivos: caso.archivos?.filter(archivo => archivo.trim() !== '') ?? []
    };
    this.displayModal = true;
  }

  tieneArchivosAdjuntos(): boolean {
    return !!this.selectedCaso?.archivos && this.selectedCaso.archivos.length > 0;
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

  closeModal() {
    this.displayModal = false;
  }

  transformedArchivos: { name: string; type: string; content: string }[] = [];

  handleFileChangesDoc(event: { archivos: any[]; nombres: string[] }): void{
    if (event.archivos.length > 0) {
      this.selectedDocumento.contenido = event.archivos[0]?.content || ""; // Base64 del archivo con valor predeterminado
      this.selectedDocumento.nombreArchivo = event.archivos[0]?.name; // Nombre del archivo con valor predeterminado
    } else {
      this.selectedDocumento.contenido = ''; // Valores vacíos si no hay archivo
      this.selectedDocumento.nombreArchivo = '';
    }
  }

  handleFileChanges(event: { archivos: any[]; nombres: string[] }): void {
    if (event.archivos.length > 0) {
      this.selectedCasoUser.archivos = event.archivos.map(file => file.content);
      this.selectedCasoUser.nombreArchivo = event.nombres
    } else {
      this.selectedCasoUser.archivos = [];
      this.selectedCasoUser.nombreArchivo = [];
    }
  }

  editCaso(caso: CasoDTO) {
    if(this.isFechaFinalizacionHoy(caso.fechaFinalizacion ?? null)){
      this.messageService.add({
        severity: 'warn',
        summary: 'Edición no permitida',
        detail: 'No puedes editar un caso si ya se ha cumplido con la fecha de finalización.',
      });
      return;
    }
    this.selectedCasoUser = { ...caso }; // Crear una copia del caso para evitar modificaciones no intencionales
    if (this.selectedCasoUser.archivos && this.selectedCasoUser.archivos.length > 0) {
      this.transformedArchivos = this.selectedCasoUser.archivos.map((archivo, index) => {
        return {
          name: this.selectedCasoUser.nombreArchivo[index], // Usa el nombre si está disponible
          type: archivo.split(';')[0].split(':')[1], // Extrae el tipo MIME del archivo
          content: archivo, // El contenido base64 original
        };
      });
    } else {
      this.transformedArchivos = []; // Inicializa como arreglo vacío si no hay archivos
    }
    this.displayEditModal = true;
  }

  isFechaFinalizacionHoy(fechaFinalizacion: Date | null): boolean {
    if (!fechaFinalizacion) return false; // Si la fecha es nula, permitir edición

    const fechaFin = new Date(fechaFinalizacion);
    const hoy = new Date();

    // Comparar solo día, mes y año (ignorando horas)
    return (
      fechaFin.getFullYear() === hoy.getFullYear() &&
      fechaFin.getMonth() === hoy.getMonth() &&
      fechaFin.getDate() === hoy.getDate()
    );
  }

  updateCaso() {
    console.log('caso:', this.selectedCasoUser);
    if (this.selectedCasoUser) {
      this.selectedCasoUser.archivos = this.selectedCasoUser.archivos || [];
      this.selectedCasoUser.nombreArchivo = this.selectedCasoUser.nombreArchivo || [];
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
