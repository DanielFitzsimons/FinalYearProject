// feed.component.ts

import { Component, OnInit } from '@angular/core';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { User } from '@angular/fire/auth';
import { AuthenticationService } from 'src/app/services/authentication.service';
@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss'],
})
export class FeedComponent implements OnInit {
  posts: any[] = [];
  userId: string = '';
  constructor(private userProfileService: UserProfileService, private auth: AuthenticationService) {}

  ngOnInit() {
    // Load posts from the service
    this.loadPosts();
  }

  loadPosts() {
    // Call the service method to get posts
    this.userProfileService.getPosts().subscribe(
      (posts) => {
        this.posts = posts;
        console.log(posts)
      },
      (error) => {
        console.error(error);
      }
    );
  }

//allows for editing of post text through service
  editPost(post: any) {
    const updatedContent = prompt('Enter updated content:', post.content);

    if (updatedContent !== null && updatedContent !== undefined) {
      this.userProfileService.editPost(post.id, updatedContent).subscribe(
        () => {
          console.log('Post updated successfully!');
          // Reload posts after updating
          this.loadPosts();
        },
        (error) => {
          console.log(error);
        }
      );
    }
  }
  
  // deletePost(post: any) {
  //   const confirmDelete = confirm('Are you sure you want to delete this post?');

  //   if (confirmDelete) {
  //     this.userProfileService.deletePost(post.id, this.userId).subscribe(
  //       () => {
  //         console.log('Post deleted successfully!');
  //         // Reload posts after deletion
  //         this.loadPosts();
  //       },
  //       (error) => {
  //         console.log(error);
  //       }
  //     );
  //   }
  // }

  //allows for deletin of posts through service
  deletePost(post: any) {
    // Get the current user from your authentication service
    const currentUser: User | null = this.auth.getCurrentUser();
  
    if (currentUser) {
      const currentUserId: string = currentUser.uid; // Extract UID from the User object
  
      const confirmDelete = confirm('Are you sure you want to delete this post?');
  
      if (confirmDelete) {
        this.userProfileService.deletePost(post.id, currentUserId).subscribe(
          () => {
            console.log('Post deleted successfully!');
            // Reload posts after deletion
            this.loadPosts();
          },
          (error) => {
            console.log(error);
          }
        );
      }
    } else {
      console.log('User not authenticated');
    }
  }

}

