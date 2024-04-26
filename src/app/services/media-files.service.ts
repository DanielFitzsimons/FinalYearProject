import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection,addDoc, getDocs } from '@angular/fire/firestore';
import { ref, uploadBytes, getDownloadURL, Storage } from '@angular/fire/storage';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class MediaFilesService {

  constructor(private firestore: Firestore, private storage: Storage) { }

 // Method to fetch videos from Firestore
getVideos(): Observable<any[]> {
  console.log('Fetching videos from Firestore'); // Log a message indicating that videos are being fetched
  // Get a reference to the 'videos' collection
  const videosRef = collection(this.firestore, 'videos');
  // Retrieve the videos data as an observable
  const videos$ = collectionData(videosRef, { idField: 'id' }) as Observable<any[]>;
  
  // Subscribe to the videos observable for logging purposes
  videos$.subscribe({
    next: videos => console.log('Fetched videos:', videos), // Log the fetched videos
    error: error => console.error('Error fetching videos:', error), // Log any errors that occur
  });
  
  // Return the observable containing the videos data
  return videos$;
}

// Method to fetch files from Firestore
getFiles(): Observable<any[]> {
  // Get a reference to the 'files' collection
  const filesRef = collection(this.firestore, 'files');
  // Retrieve the files data as an observable
  return collectionData(filesRef, { idField: 'id' }) as Observable<any[]>;
}

// Method to upload a file to a group's subcollection
async uploadFileToGroup(fileData: File, groupId: string): Promise<void> {
  // Get a reference to the subcollection of files for the specified group
  const groupFilesRef = collection(this.firestore, `groups/${groupId}/files`);
  // Add the file data to the group's files subcollection
  await addDoc(groupFilesRef, {...fileData});
}

// Method to fetch files by groupId from the subcollection
async getFilesByGroupId(groupId: string): Promise<any[]> {
  // Get a reference to the subcollection of files for the specified group
  const groupFilesRef = collection(this.firestore, `groups/${groupId}/files`);
  // Retrieve the documents from the group's files subcollection
  const querySnapshot = await getDocs(groupFilesRef);
  // Map the document data to an array of files
  const files = querySnapshot.docs.map(doc => doc.data());
  // Return the array of files
  return files;
}






}
