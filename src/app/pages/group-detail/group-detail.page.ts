import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Team, Post } from 'src/app/models/model/model';
import { GroupService } from 'src/app/services/group.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

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

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private auth: AuthenticationService,
    private alertController: AlertController,
    private userProfileService: UserProfileService,
    private groupService: GroupService
  ) { 
    this.postForm = this.fb.group({
      content: ['', Validators.required],
  });
}

  ngOnInit() {
    this.auth.getCurrentUser().subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.userProfileService.getGroupIdForUser(this.userId).subscribe(
          (groupId) => {
            if (groupId) {
              this.groupId = groupId;
              this.loadPostsForGroup(this.groupId);
            } else {
              console.error('No group found for this user.');
            }
          },
          (error) => console.error('Error fetching group for user:', error)
        );
      } else {
        console.error('User is not logged in.');
      }
    });

    this.route.paramMap.subscribe(params => {
      const groupId = params.get('id');
      if (groupId) {
        this.groupId = groupId;
        this.loadGroup(groupId); // Fetch and load group details
        this.loadPostsForGroup(groupId); // Load posts for the group
      }
    });
  }

  loadGroup(groupId: string) {
    this.groupService.getGroupById(groupId).then(group => {
      this.group = group;
    }).catch(error => {
      console.error('Error fetching group details:', error);
      this.presentAlert('Error', 'Failed to load group details.');
    });
  }
  

  async addPost() {
    if (this.postForm.valid) {
      const user = await firstValueFrom(this.auth.getCurrentUser()); // Make sure this correctly awaits the current user
      const groupId = this.route.snapshot.paramMap.get('id');
      const postContent = this.postForm.value.content;
      if (user && groupId) {
        // Note: Adjust according to whether you're using images or other additional data
        this.userProfileService.createPost(user.uid, postContent, groupId)
          .subscribe({
            next: (postId) => {
              console.log(`Post created with ID: ${postId}`);
              this.postForm.reset(); // Reset the form after successful post creation
              this.loadPostsForGroup(groupId); // Refresh the list of posts
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
    this.userProfileService.getPostsByGroupId(groupId).subscribe(
      (retrievedPosts) => {
        // Convert Firestore Timestamps to JavaScript Date objects
        this.posts = retrievedPosts.map(post => ({
          ...post,
          timestamp: post.timestamp.toDate() // Assuming 'timestamp' is the field with the Firestore Timestamp
        }));
        console.log('Posts for group:', this.posts);
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
  
  
  
  // Utility function to present an alert - add this to your class
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

}
