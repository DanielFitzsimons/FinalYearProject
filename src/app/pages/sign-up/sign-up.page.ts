import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthenticationService } from 'src/app/authentication.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage {

  credentials = this.fb.nonNullable.group({
    email : ['', [Validators.required, Validators.email]],
    password : ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    public fb: FormBuilder,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private authService: AuthenticationService,
    private router: Router
  ) { }

  get email(){
    return this.credentials.controls.email;
  }

  get password(){
    return this.credentials.controls.password;
  }

  async register(){

    const loading = await this.loadingController.create();
    await loading.present();

    const user = await this.authService.register(
      this.credentials.getRawValue()
    );

    console.log(
      '🚀 ~ file: sign-up.page.ts:50 ~ SignUp ~ register ~ user',
      user
    );
    // Dismiss the loading spinner
    await loading.dismiss();

    if(user){
      this.router.navigateByUrl('/home', {replaceUrl: true});
  
    }else{
      this.showAlert('Registration failed ', 'Please Try Again!');
    }
    
  }

  
 async showAlert(header:string, message: string){
const alert = await this.alertController.create({
  header,
  message,
  buttons: ['Ok'],
});
  await alert.present();
 }

}
