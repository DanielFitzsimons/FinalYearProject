// feed.component.ts

import { Component, OnInit } from '@angular/core';
import { UserProfileService } from 'src/app/services/user-profile.service';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss'],
})
export class FeedComponent implements OnInit {
  posts: any[] = [];

  constructor(private userProfileService: UserProfileService) {}

  ngOnInit() {
    // Load posts from the service
    this.loadPosts();
  }

  loadPosts() {
    // Call the service method to get posts
    this.userProfileService.getPosts().subscribe(
      (posts) => {
        this.posts = posts;
      },
      (error) => {
        console.error(error);
      }
    );
  }
}

