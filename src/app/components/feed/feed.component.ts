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
  groupId: string = '';
  constructor(private userProfileService: UserProfileService, private auth: AuthenticationService) {}

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
  }
  
  
  
  
  loadPosts() {
    this.userProfileService.getPosts().subscribe(
      (retrievedPosts) => {
        this.posts = retrievedPosts;
        console.log('Posts in component:', this.posts); // This should log the posts in the component
      },
      (error) => {
        console.error('Error loading posts in component:', error); // Make sure errors are logged
      }
    );
  }
  

loadPostsForGroup(groupId: string) {
  this.userProfileService.getPostsByGroupId(groupId).subscribe(
    (retrievedPosts) => {
      this.posts = retrievedPosts;
      console.log('Posts for group:', this.posts);
    },
    (error) => console.error('Error loading posts for group:', error)
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
    this.auth.getCurrentUser().subscribe(currentUser => {
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
    });
  }
}  

