import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { User } from 'src/app/models/model/model';
@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.page.html',
  styleUrls: ['./create-post.page.scss'],
})
export class CreatePostPage implements OnInit {

  selectedImageFile: File | undefined;
  postContent: string = '';
  previewImageUrl: string | undefined;
  groupId?: string;

  userId: string | null = null;

  //currentUserProfile$: Observable<UserProfileService | undefined>;

  constructor(
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private auth: AuthenticationService,
    ) { }

    ngOnInit() {
      const user = this.auth.getCurrentUser(); // Assuming this is synchronous and can return null
      if (user) {
        this.userId = user.uid;
        this.userProfileService.getGroupIdForUser(user.uid).subscribe(
          (groupId: string | null) => { // Explicit type here
            if (groupId) {
              this.groupId = groupId;
            } else {
              console.error('No group found for this user.');
            }
          },
          (error: any) => { // Explicit type here, though it's better to use a more specific type if possible
            console.error('Error fetching group for user:', error);
          }
        );
      } else {
        console.error('User is not logged in.');
      }
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
  
  createPost() {
    const user = this.auth.getCurrentUser();
    if (user === null) {
      console.error('No authenticated user found');
      return;
    }
  
    if (this.postContent && this.groupId) {
      const userId = user.uid;
  
      this.userProfileService.createPost(userId, this.postContent, this.groupId, this.selectedImageFile).subscribe(
        (result) => {
          console.log('Post Created Successfully!', result);
          // Reset fields after successfully creating a post
          this.postContent = '';
          this.selectedImageFile = undefined;
          this.previewImageUrl = undefined;
          // Handle navigation or state reset if necessary
        },
        (error) => {
          console.error('Error creating post:', error);
        }
      );
    } else {
      console.error('Missing required information for post creation', {
        isAuthenticated: user !== null,
        postContent: !!this.postContent,
        groupId: this.groupId
      });
    }
  }
  
  
  
  

  
  
  
  

}
