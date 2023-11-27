import { Component } from '@angular/core';
import { FirebaseTSAuth } from 'firebasets/firebasetsAuth/firebaseTSAuth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
auth = new FirebaseTSAuth();
isLoggedin = false;

  constructor() {
    this.auth.listenToSignInStateChanges(
      user =>{
        this.auth.checkSignInState(
          {
            whenSignedIn: user =>{
              alert("Logged in");
            },
            whenSignedOut: user => {
              alert("Logged out");
            }, 
            whenChanged: user =>{

            }
          }
        );
      }
    )
  }

  loggedIn(){
    return this.auth.isSignedIn();
  }
}
