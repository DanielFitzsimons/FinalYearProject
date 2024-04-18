import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Team, Post } from 'src/app/models/model/model';
import { GroupService } from 'src/app/services/group.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CreatePostPage } from '../create-post/create-post.page';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.page.html',
  styleUrls: ['./group-detail.page.scss'],
})
export class GroupDetailPage implements OnInit {

  group: Team | null = null!;
  postForm: FormGroup;
  posts: Post[] = [];
  userId: string = ''
  groupId: string =''
  groups: Team[] = []

  selectedFile?: File;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private auth: AuthenticationService,
    private alertController: AlertController,
    private userProfileService: UserProfileService,
    private groupService: GroupService,
    private dialog: MatDialog,
    private router: Router
    
  ) { 
    this.postForm = this.fb.group({
      content: ['', Validators.required],
  });
  
}


ngOnInit() {
  this.auth.getCurrentUser().subscribe(user => {
    if (user) {
      this.userId = user.uid;
      console.log("Authenticated User ID:", this.userId);
      
      this.route.paramMap.subscribe(params => {
        const groupId = params.get('id');
        console.log("Route parameter groupId:", groupId);
        
        if (groupId) {
          this.groupId = groupId;
          console.log("Set groupId from route:", this.groupId);
          this.loadGroup(this.groupId); 
          this.loadPostsForGroup(this.groupId);
        }
      });
    } else {
      console.error('User is not logged in.');
      this.router.navigate(['/login']);
    }
  });
}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = undefined;
    }
  }
  

  loadGroup(groupId: string) {
    console.log("Loading group details for groupId:", groupId);
    this.groupService.getGroupById(groupId).then(group => {
      console.log("Group details loaded:", group);
      this.group = group;
    }).catch(error => {
      console.error('Error fetching group details:', error);
      this.presentAlert('Error', 'Failed to load group details.');
    });
}
  

  async addPost() {
    if (this.postForm.valid) {
      const user = await firstValueFrom(this.auth.getCurrentUser());
      const groupId = this.route.snapshot.paramMap.get('id');
      const postContent = this.postForm.value.content;

      if (user && groupId) {
        this.userProfileService.createPost(user.uid, postContent, groupId, this.selectedFile)
          .subscribe({
            next: (postId) => {
              console.log(`Post created with ID: ${postId}`);
              this.postForm.reset();
              this.selectedFile = undefined; // Reset selected file
              this.loadPostsForGroup(groupId);
            },
            error: (error) => {
              console.error('Error creating post:', error);
              this.presentAlert('Failed to add post', 'An unexpected error occurred');
            }
          });
      } else {
        console.error('User not logged in or Group ID not found.');
        this.presentAlert('Error', 'You must be logged in to post.');
      }
    }
  }

  loadPostsForGroup(groupId: string) {
    console.log("Loading posts for groupId:", groupId);
    this.userProfileService.getPostsByGroupId(groupId).subscribe(
      (retrievedPosts) => {
        console.log('Posts loaded for groupId:', groupId, retrievedPosts);
        this.posts = retrievedPosts.map(post => ({
          ...post,
          timestamp: post.timestamp.toDate()
        }));
      },
      (error) => console.error('Error loading posts for group:', error)
    );
}

  editPost(post: any) {
    const updatedContent = prompt('Enter updated content:', post.content);

    if (updatedContent !== null && updatedContent !== undefined) {
      this.userProfileService.editPost(post.id, updatedContent).subscribe(
        () => {
          console.log('Post updated successfully!');
          // Reload posts after updating
          this.loadPostsForGroup(this.groupId);
        },
        (error) => {
          console.log(error);
        }
      );
    }
  }

  deletePost(post: any) {
    this.auth.getCurrentUser().subscribe(currentUser => {
      if (currentUser) {
        const currentUserId: string = currentUser.uid; // Extract UID from the User object
  
        const confirmDelete = confirm('Are you sure you want to delete this post?');
  
        if (confirmDelete) {
          this.userProfileService.deletePost(post.id, currentUserId).subscribe(
            () => {
              console.log('Post deleted successfully!');
              // Reload posts after deletion
              this.loadPostsForGroup(this.groupId);
            },
            (error) => {
              console.log(error);
            }
          );
        }
      } else {
        console.log('User not authenticated');
      }
    });
  }
  
  navigateToMediaFilesPage(groupId: any) {
    this.router.navigate(['/media-files', groupId]);
  }
  
  
  // Utility function to present an alert - add this to your class
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  //opens pop up box for posts
  onCreatePostClick(){
    this.dialog.open(CreatePostPage);
  }

}
