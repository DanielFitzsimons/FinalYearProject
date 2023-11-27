import { Injectable } from '@angular/core';
import {
  Auth, // Used to get the current user and subscribe to the auth state.
  createUserWithEmailAndPassword, // Used to create a user in Firebase auth.
  sendPasswordResetEmail, // Used to send a password reset email.
  signInWithEmailAndPassword, // Used to sign in a user with email and password.
  signOut, // Used to sign out a user.
} from '@angular/fire/auth';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private isAuthenticated: boolean = false;
  constructor(private auth:Auth, private firestore: Firestore) { }

  async register({email, password}: {email:string, password: string}){
    try{
      const credentials = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const ref = doc(this.firestore, `users/${credentials.user.uid}`);
      setDoc(ref, {email});
      this.isAuthenticated = true;
      return credentials;
    }catch(e){
      console.log("Error registering: ", e);
      this.isAuthenticated = false;
      return null;
    }
  }

  async login({ email, password }: { email: string, password: string }) {
    try {
      const credentials = await signInWithEmailAndPassword(this.auth, email, password);
  
      console.log('Credentials:', credentials);
      console.log('User:', credentials.user);
  
      if (credentials && credentials.user.uid) {
        this.isAuthenticated = true;
        return credentials.user;
      } else {
        return null;
      }
    } catch (e) {
      console.error('Error during login: ', e);
      this.isAuthenticated = false;
      return null;
    }
  }

  resetPw(email: string) {
    // Pass in athentication private and email address
    return sendPasswordResetEmail(this.auth, email);
  }

  isAuthenticatedUser(){
    return this.isAuthenticated;
  }
  

  async logout(){
    return signOut(this.auth);
  }
}
