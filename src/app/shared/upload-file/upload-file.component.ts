import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FileUpload } from 'src/app/interfaces/file';

@Component({
  selector: 'shared-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})

export class UploadFileComponent {
  filesBase64: { name: string; type: string; content: string }[] = [];
  fileNames: string[] = [];
  fileUrls: { url: string; name: string }[] = [];

  @Output() uploadComplete = new EventEmitter<FileUpload>();
  @Output() deleteFileEvent = new EventEmitter<boolean>();
  @Input() disabled: boolean = false;
  @Input() initialFiles: { name: string; type: string; content: string}[] = [];

  ngOnInit(){
    // if(this.initialFiles && this.initialFiles.length > 0){
    //   this.filesBase64 = [...this.initialFiles];
    //   this.fileNames = this.initialFiles.map(file => file.name);

    //   // Emitimos los archivos al inicializar el componente
    //   this.uploadComplete.emit({
    //     archivos: this.filesBase64,
    //     nombres: this.fileNames
    //   });
    // }
    if (this.initialFiles && this.initialFiles.length > 0) {
      this.filesBase64 = [...this.initialFiles];
      this.fileNames = this.initialFiles.map(file => file.name);
      this.fileUrls = this.initialFiles.map(file => ({
          url: '', // Asigna una URL vacía si no está disponible
          name: file.name,
      }));

      this.uploadComplete.emit({
          archivos: this.filesBase64,
          nombres: this.fileNames,
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes["initialFiles"] && changes["initialFiles"].currentValue) {
    //   this.filesBase64 = [...changes["initialFiles"].currentValue];
    //   this.fileNames = this.initialFiles.map(file => file.name);
    //   this.uploadComplete.emit({
    //     archivos: this.filesBase64,
    //     nombres: this.fileNames
    //   });
    // }
    if (changes["initialFiles"] && changes["initialFiles"].currentValue) {
      this.filesBase64 = [...changes["initialFiles"].currentValue];
      this.fileNames = this.initialFiles.map(file => file.name);
      this.fileUrls = this.initialFiles.map(file => ({
          url: '', // Asigna una URL vacía si no está disponible
          name: file.name,
      }));

      this.uploadComplete.emit({
          archivos: this.filesBase64,
          nombres: this.fileNames,
      });
    }
  }

  selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach((file) => {
        this.convertToBase64(file).then((base64: string) => {
          const fileObject = {
            name: file.name,
            type: file.type,
            content: base64
          };

          this.filesBase64.push(fileObject);
          this.fileNames.push(file.name);

          // Emitimos un objeto completo con archivos y nombres
          this.uploadComplete.emit({
            archivos: this.filesBase64,
            nombres: this.fileNames
          });
        });
      });
    }
  }

  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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

  deleteFile(event: Event, index: number): void {
    event.stopPropagation();
    if(this.fileUrls[index]?.url){
      URL.revokeObjectURL(this.fileUrls[index].url);
    }
    this.filesBase64.splice(index, 1);
    this.fileNames.splice(index, 1);
    //URL.revokeObjectURL(this.fileUrls[index].url);  // Liberar memoria de la URL
    this.fileUrls.splice(index, 1);

    // Emitir el objeto completo con archivos y nombres
    this.uploadComplete.emit({
      archivos: this.filesBase64,
      nombres: this.fileNames
    });
  }

  deleteAllFiles(event: Event): void {
    event.stopPropagation();
    this.filesBase64 = [];
    this.fileNames = [];
    this.fileUrls.forEach((file) => URL.revokeObjectURL(file.url));  // Liberar URLs generadas
    this.fileUrls = [];

    // Emitir el objeto vacío con estructura FileUpload
    this.uploadComplete.emit({
      archivos: [],
      nombres: []
    });
  }
}
