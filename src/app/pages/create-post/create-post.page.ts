import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { read } from 'fs';
@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.page.html',
  styleUrls: ['./create-post.page.scss'],
})
export class CreatePostPage implements OnInit {

  selectedImageFile: File | undefined;

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }

  onPhotoSelected(photoSelector: HTMLInputElement){
    //this.selectedImageFile = photoSelector.files[0];
    if(!this.selectedImageFile) return;
    let fileReader =new FileReader();
    fileReader.readAsDataURL(this.selectedImageFile);
    fileReader.addEventListener(
      "loadend",
      ev => {
        let readableString = fileReader.result?.toString();
        let postPreviewImage = <HTMLImageElement>document.getElementById("post-preview-image");
        //postPreviewImage.src = readableString;
      }
    )
  }

}
