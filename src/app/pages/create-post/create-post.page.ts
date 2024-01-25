import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { read } from 'fs';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.page.html',
  styleUrls: ['./create-post.page.scss'],
})
export class CreatePostPage implements OnInit {

  selectedImageFile: File | undefined;
  postContent: string = '';
  previewImageUrl: string | undefined;

  constructor(
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private auth: AuthenticationService,
    ) { }

  ngOnInit() {
  }
  //allows for choosing a photo from system
  onPhotoSelected(event: Event) {
    const fileInput = event?.target as HTMLInputElement;
  
    if (fileInput && fileInput.files) {
      const file = fileInput.files[0];
  
      if (file) {
        // Set the preview image URL
        this.previewImageUrl = URL.createObjectURL(file);
        this.selectedImageFile = file;  // Save the selected image file
      }
    }
  }
  
//handles creating of posts that links with service
  createPost() {
    const user = this.auth.getCurrentUser();
  
    if (user && this.postContent) {
      const userId = user.uid;
  
      this.userProfileService.createPost(userId, this.postContent, this.selectedImageFile).subscribe(
        (result) => {
          if (typeof result === 'string') {
            const postId = result;
            console.log('Post Created Successfully!', postId);
            // Now you can use the postId as needed
          } else {
            console.log('Post Created Successfully!');
          }
        },
        (error) => {
          console.log(error);
        }
      );
    } else {
      console.log('User is not authenticated, post content is empty, or image is not selected');
    }
  
    this.postContent = '';
    this.previewImageUrl = undefined;
  }
  

  
  
  
  

}
