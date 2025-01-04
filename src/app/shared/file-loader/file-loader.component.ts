import { Component, Input } from '@angular/core';

@Component({
  selector: 'shared-file-loader',
  templateUrl: './file-loader.component.html',
  styleUrls: ['./file-loader.component.css']
})
export class FileLoaderComponent {
  @Input() file: string = '';  // Base64 del archivo
  @Input() fileName: string = 'documento'; // Nombre por defecto
  @Input() fileType: string = '';  // Tipo de archivo (MIME)

  visualizarArchivo() {
    const base64Data = this.file.startsWith('data:') ? this.file : `data:${this.fileType};base64,${this.file}`;
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: this.fileType });
    const url = URL.createObjectURL(blob);
    window.open(url);
  }

  descargarArchivo() {
    const mimeType = this.fileType;  // El tipo MIME correcto
    const byteCharacters = atob(this.file.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: this.fileType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = this.fileName || 'archivo';
    link.click();

    URL.revokeObjectURL(url);
  }
}
