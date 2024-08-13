import { Component, Input } from '@angular/core';

@Component({
  selector: 'shared-image-loader',
  templateUrl: './image-loader.component.html',
  styleUrls: ['./image-loader.component.scss']
})
export class ImageLoaderComponent {
  @Input() height: number = 50;
  @Input() width: number = 50;
  @Input() image!: string;
  @Input() imageErr!: string;
  @Input() alt: string = "";

  constructor() {
  }

  ngOnInit(): void {
  }
}

