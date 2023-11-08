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

  constructor(private auth:Auth, private firestore: Firestore) { }

  async register({email, password}: {email:string, password: string}){
    try{
      const credentials = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const ref = doc(this.firestore, 'users/${credentials.user.id');
      setDoc(ref, {email});
      return credentials;
    }catch(e){
      console.log("Error registering: ", e);
      return null;
    }
  }
}
