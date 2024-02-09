import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';
import {MatDialog } from '@angular/material/dialog';
import {
} from '@ionic/angular';
import { CreatePostPage } from '../create-post/create-post.page';



@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private dialog: MatDialog 
  ) {}
  
  ngOnInit(){
    // Inside a component that needs user information
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // User is signed in
        console.log(user);
      } else {
        // User is null, meaning not signed in or the state has not been restored yet
        console.log('User is not signed in');
      }
    });

  }

  async logout(){
    await this.authService.logout();

    this.router.navigateByUrl('/', {replaceUrl: true});
  }
  //opens pop up box for posts
  onCreatePostClick(){
    this.dialog.open(CreatePostPage);
  }

}
