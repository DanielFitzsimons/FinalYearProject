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
import { Timestamp } from '@angular/fire/firestore';

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

  creatingPost = false;

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
  

// Method to add a post
async addPost() {
  // Set creatingPost to true when the post creation process starts
  this.creatingPost = true;

  if (this.postForm.valid) {
    const user = await firstValueFrom(this.auth.getCurrentUser());
    const groupId = this.route.snapshot.paramMap.get('id');
    const postContent = this.postForm.value.content;

    if (user && groupId) {
      // Call service to create post
      this.userProfileService.createPost(user.uid, postContent, groupId, this.selectedFile)
        .subscribe({
          next: (postId) => {
            console.log(`Post created with ID: ${postId}`);
            // Reset form and selected file after successful post creation
            this.postForm.reset();
            this.selectedFile = undefined;
            // Reload posts for the group
            this.loadPostsForGroup(groupId);
            console.log('Post creation process completed.');
            // Set creatingPost to false after successful post creation
            this.creatingPost = false;
          },
          error: (error) => {
            console.error('Error creating post:', error);
            // Display error alert if post creation fails
            this.presentAlert('Failed to add post', 'An unexpected error occurred');
            // Set creatingPost to false if there's an error
            this.creatingPost = false;
          },
        });
    } else {
      console.error('User not logged in or Group ID not found.');
      // Display error alert if user is not logged in or group ID is not found
      this.presentAlert('Error', 'You must be logged in to post.');
      // Set creatingPost to false if there's an error
      this.creatingPost = false;
    }
  }
}

// Method to delete a group
async deleteGroup(group: Team) {
  // First, make sure that 'group' and 'group.id' are defined.
  if (!group || !group.id) {
    // Display error alert if group or group ID is not defined
    this.presentAlert('Error', 'The group is not specified or has no ID.');
    return;
  }

  // Use optional chaining to safely access 'uid'.
  const currentUser = await firstValueFrom(this.auth.getCurrentUser());
  const currentUserId = currentUser?.uid;

  if (currentUserId === undefined) {
    // Display error alert if current user ID is undefined
    this.presentAlert('Error', 'Failed to get current user ID.');
    return;
  }

  // Now 'currentUserId' is guaranteed to be a string and not undefined.
  if (currentUserId === group.creatorId) {
    try {
      // Call service to delete the group
      await this.groupService.deleteGroup(group.id, currentUserId);
      console.log('Group deleted successfully');
      // Navigate to groups page after successful group deletion
      this.router.navigate(['/groups-page']);
    } catch (error) {
      console.error('Error deleting group:', error);
      // Display error alert if group deletion fails
      this.presentAlert('Error', 'Failed to delete the group.');
    }
  } else {
    // Display error alert if user does not have permission to delete the group
    this.presentAlert('Error', 'You do not have permission to delete this group.');
  }
}


// Utility function to present a confirmation alert
async presentAlertConfirm(header: string, message: string, onConfirm: () => void) {
  const alert = await this.alertController.create({
    header: header,
    message: message,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        cssClass: 'secondary',
        handler: (blah) => {
          console.log('Confirm Cancel: blah');
        }
      }, {
        text: 'Okay',
        handler: () => {
          onConfirm();
        }
      }
    ]
  });

  await alert.present();
}



// Method to convert Firestore Timestamp to Date
  convertTimestampToDate(timestamp: Date | Timestamp | null): Date | null {
    if (timestamp === null) {
      return null;
    } else if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    } else {
      return timestamp;
    }
  }

// Method to load posts for a group
  loadPostsForGroup(groupId: string) {
    console.log("Loading posts for groupId:", groupId);
    //subscribe to get posts methids in user Profile service
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
// Method to edit a post
  editPost(post: any) {
    const updatedContent = prompt('Enter updated content:', post.content);

    if (updatedContent !== null && updatedContent !== undefined) {
      this.userProfileService.editPost(this.groupId ,post.id, updatedContent).subscribe(
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
// Method to delete a post
  deletePost(post: any) {
    this.auth.getCurrentUser().subscribe(currentUser => {
      if (currentUser) {
        const currentUserId: string = currentUser.uid; // Extract UID from the User object
  
        const confirmDelete = confirm('Are you sure you want to delete this post?'); //pop up message to confirm deletion
  
        if (confirmDelete) {
          //call delete post method from service 
          this.userProfileService.deletePost(this.groupId, post.id, currentUserId).subscribe(
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
  
  //navigate to media files page
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
