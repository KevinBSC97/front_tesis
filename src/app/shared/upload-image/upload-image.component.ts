import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'shared-upload-image',
  templateUrl: './upload-image.component.html',
  styleUrls: ['./upload-image.component.scss']
})
export class UploadImageComponent {
  @Output() eventUpload: EventEmitter<any[]> = new EventEmitter();
  @Output() loading: EventEmitter<boolean> = new EventEmitter();
  @Output() deletePictureEvent: EventEmitter<boolean> = new EventEmitter();

  @Input() label: string = "imagen";
  @Input() bottomLabel: string = "";
  @Input() bottomLabelExtensionAllowed: string = "";
  @Input() accept: string = "";
  @Input() urlPhoto!: string | null;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;

  public pictures: string[] = [];
  public loadImage: boolean = false;
  showError: boolean = false;
  pictureControl: FormControl = new FormControl();
  type: string = "";

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["urlPhoto"]) {
      // Handle any changes to the urlPhoto if needed
    }
  }
  selectPictures(event: Event) {
    this.showError = false;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.loadImage = true;
      this.loading.emit(true);
      const readers: FileReader[] = [];
      const newPictures: string[] = [];

      Array.from(input.files).forEach((file: File) => {
        if (file.type.includes("image/")) {
          const reader = new FileReader();
          readers.push(reader);

          reader.onload = (e: ProgressEvent<FileReader>) => {
            const result = (e.target as FileReader).result as string;
            newPictures.push(result);
            if (newPictures.length === input.files?.length) {
              this.pictures = [...this.pictures, ...newPictures];
              this.eventUpload.emit(this.pictures);
              this.loadImage = false;
            }
          };

          reader.readAsDataURL(file);
        } else {
          this.showError = true;
          this.loadImage = false;
        }
      });
    }
  }


  deletePicture(event: any,pictureToDelete: string) {
    event.stopPropagation();
    this.pictures = this.pictures.filter(picture => picture !== pictureToDelete);
    this.deletePictureEvent.emit(true);
  }

  deleteAllPictures(event: any) {
    event.stopPropagation();
    this.pictures = [];
    this.deletePictureEvent.emit(true);
  }
}
