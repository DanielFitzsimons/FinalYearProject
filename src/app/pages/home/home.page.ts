import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/authentication.service';
import { Router } from '@angular/router';
import {MatDialog } from '@angular/material/dialog';
import {
  CheckboxCustomEvent,
  IonModal,
  IonRouterOutlet,
  LoadingController,
  AlertController,
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
    private loadingController: LoadingController,
    private alertController : AlertController,
    private dialog: MatDialog 
  ) {}

  async logout(){
    await this.authService.logout();

    this.router.navigateByUrl('/', {replaceUrl: true});
  }

  onCreatePostClick(){
    this.dialog.open(CreatePostPage);
  }

}
