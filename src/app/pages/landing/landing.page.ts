import { Component, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AuthenticatorPage } from '../authenticator/authenticator.page';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage implements OnInit {

  constructor(private loginSheet: MatBottomSheet, private dialog: MatDialog) { }

  ngOnInit() {
  }

  onGetStarted(){
    //this.loginSheet.open(AuthenticatorComponent);
    this.dialog.open(AuthenticatorPage, {
      width: '50%', // adjust the width as needed
      height: '70%', // adjust the height as needed
      position: { top: '10%', left: '25%', }, // adjust the position as needed
     
    })
  }

}
