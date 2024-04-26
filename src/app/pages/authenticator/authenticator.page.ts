import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-authenticator',
  templateUrl: './authenticator.page.html',
  styleUrls: ['./authenticator.page.scss'],
})
export class AuthenticatorPage implements OnInit {
// Enum to define different states of the authenticator component
  state = AuthenticatorCompStart.LOGIN;
  // Form group for user credentials
  credentials = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    name: ['', Validators.required],
  });

  constructor(
    private fb:FormBuilder, // FormBuilder for creating forms
    private loadingController: LoadingController, // <-- Inject the LoadingController to handle loading state by displaying a spinner
    private alertController: AlertController, // <-- Inject the AlertController to handle errors and display alert messages
    private auth: AuthenticationService, // <-- Inject the AuthService to handle login and registration
    private router: Router, // <-- Inject the Router to redirect after successful login
    //private dialogRef: MatDialogRef<AuthenticatorPage>
    
  ) { }

  ngOnInit() {
  }
   // Easy access for form fields. This is used in the template to display validation errors.
   get email() {
    return this.credentials.controls.email;
  }

  // Easy access for form fields. This is used in the template to display validation errors.
  get password() {
    return this.credentials.controls.password;
  }

  // Register a new user with the AuthService. If successful, redirect to the home page.
  async register() {
    
    // Call the register method from the AuthService. This returns a user object if successful, or null if unsuccessful.
    const user = await this.auth.register(
      this.credentials.getRawValue() // <-- Pass the raw value of the form fields to the register method
    );
    // Log the user object to the console. This will be `null` if the user was not created.
    console.log(
      '🚀 ~ file: login.page.ts:50 ~ LoginPage ~ register ~ user',
      user
    );
  
    // If the user is successfully created, redirect to the home page. Otherwise, display an error.
    if (user) {
      this.router.navigateByUrl('/profile', { replaceUrl: true });
      //this.dialogRef.close();
      
    } else {
      //this.dialogRef.close();
      this.showAlert('Registration failed', 'Please try again!');
    }

    
  }

  async login() {
   
    // Call the login method from the AuthService. This returns a user object if successful, or null if unsuccessful.
    const user = await this.auth.login(this.credentials.getRawValue());
    // Log the user object to the console. This will be `null` if the user was not logged in.
    console.log('🚀 ~ file: login.page.ts:73 ~ LoginPage ~ login ~ user', user);


    // If the user is successfully logged in, redirect to the home page. Otherwise, display an error via alert.
    if (user) {
      this.router.navigateByUrl('/home', { replaceUrl: true });
      //this.dialogRef.close();
    } else {
      //this.dialogRef.close();
      this.showAlert('Login failed', 'Please try again!');
    }

    
  }

  async sendReset() {
    // Create a loading overlay. This will be displayed while the request is running.
    const loading = await this.loadingController.create();
    await loading.present();
    // Call the resetPw method from the AuthService. This returns a promise.
    await this.auth.resetPw(this.email.value);
    // Dismiss the loading spinner
    await loading.dismiss();
    // Show an alert message
    this.showAlert(
      'Password reset',
      'Check your inbox for the password reset link'
    );

    //this.dialogRef.close();
  }
 // Change state to forgot password
  forgotPassword(){
    this.state = AuthenticatorCompStart.FORGOT_PASSWORD;
  }
  // Change state to register
  createAccount(){
    this.state = AuthenticatorCompStart.REGISTER;
  }
  // Change state to login
  loginState(){
    this.state = AuthenticatorCompStart.LOGIN;
  }
  // Check if current state is login
  isLoginState(){
    return this.state === AuthenticatorCompStart.LOGIN;
  }
   // Check if current state is register
  isRegisterState(){
    return this.state === AuthenticatorCompStart.REGISTER;
  }
  // Check if current state is forgot password
  isForgotPasswordState(){
    return this.state === AuthenticatorCompStart.FORGOT_PASSWORD;
  }
  // Get text corresponding to current state
  getStateText(){
    switch(this.state){
      case AuthenticatorCompStart.LOGIN:
        return "Login";
      case AuthenticatorCompStart.REGISTER:
        return "Register";
      case AuthenticatorCompStart.FORGOT_PASSWORD:
        return "Forgot Password";
    }
  }
  // Display an alert message
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      cssClass: 'top-alert', // Custom CSS class for positioning
      header,
      message,
      buttons: ['OK'],
    });
     // Add CSS rule for 'top-alert' class
      const style = document.createElement('style');
      style.textContent = `
        .top-alert {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 9999;
        }
      `;
      document.head.appendChild(style);

    await alert.present();
  }

  

}
// Enum for defining different states of the authenticator component
export enum AuthenticatorCompStart{
  LOGIN,
  REGISTER,
  FORGOT_PASSWORD
}
