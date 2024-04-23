// feed.component.ts

import { Component, OnInit } from '@angular/core';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { switchMap, map } from 'rxjs/operators';
import { Observable, forkJoin, from } from 'rxjs';
import { Team, Post } from 'src/app/models/model/model';
import { GroupService } from 'src/app/services/group.service';
import { EMPTY } from 'rxjs';
@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss'],
})
export class FeedComponent implements OnInit {
  posts: any[] = [];
  userId: string = '';
  groupId: Team[] = [];
  constructor(private userProfileService: UserProfileService, private auth: AuthenticationService, private groupService: GroupService) {}

  ngOnInit() {
    this.auth.getCurrentUser().subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.groupService.getGroupsForUser(this.userId).subscribe(
          (groupId) => {
            if (groupId) {
              this.groupId = groupId;
              //this.loadPostsForGroup(this.groupId);
              this.loadPostsForAllGroups(this.userId);
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
        // Convert Firestore Timestamps to JavaScript Date objects
        this.posts = retrievedPosts.map(post => ({
          ...post,
          timestamp: post.timestamp.toDate() // Assuming 'timestamp' is the field with the Firestore Timestamp
        }));
        console.log('Posts in component:', this.posts);
      },
      (error) => {
        console.error('Error loading posts in component:', error);
      }
    );
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

  loadPostsForAllGroups(userId: string) {
    from(this.groupService.getGroupsForUser(userId)).pipe(
      switchMap((groups: Team[]): Observable<Post[][]> => {
        console.log(`Found ${groups.length} groups for user ${userId}`);
        // Filter only groups where the user is a member
        const userGroups = groups.filter(group => group.members.includes(userId));
        console.log(`User is a member of ${userGroups.length} groups`);
  
        if (userGroups.length === 0) {
          return EMPTY; // Use EMPTY when there are no user groups
        }
  
        const postsObservables = userGroups.map(group => {
          console.log(`Fetching posts for group ${group.id}`);
          return this.groupService.getPostsByGroupId(group.id as string);
        });
  
        return forkJoin(postsObservables);
      }),
      map((postsArrays: Post[][]) => {
        console.log(`Fetched posts for all groups, total post arrays: ${postsArrays.length}`);
        const allPosts = postsArrays.flat().map(doc => {
          let timestamp: Date | null = null;
          if (doc.timestamp) {
            try {
              timestamp = new Date(doc.timestamp);
              if (isNaN(timestamp.getTime())) {
                timestamp = null;
              }
            } catch {
              timestamp = null;
            }
          }
          return {
            ...doc,
            timestamp // This will be a valid Date object or null
          };
        });
  
        return allPosts.sort((a, b) => {
          const dateA = a.timestamp ? a.timestamp.getTime() : 0;
          const dateB = b.timestamp ? b.timestamp.getTime() : 0;
          return dateB - dateA;
        });
      })
    ).subscribe(
      (sortedPosts: Post[]) => {
        console.log(`Total sorted posts received: ${sortedPosts.length}`); // Log the total number of sorted posts received
        console.log('Posts loaded:', sortedPosts); // Console log to check the posts
        this.posts = sortedPosts;
      },
      error => console.error('Error loading posts:', error)
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
          this.loadPostsForAllGroups(this.userId);
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
        const currentUserId: string = currentUser.uid; 
  
        const confirmDelete = confirm('Are you sure you want to delete this post?');
  
        if (confirmDelete) {
          this.userProfileService.deletePost(post.id, currentUserId).subscribe(
            () => {
              console.log('Post deleted successfully!');
              // Reload posts after deletion
              this.loadPostsForAllGroups(this.userId);
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

