import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection,addDoc, getDocs } from '@angular/fire/firestore';
import { ref, uploadBytes, getDownloadURL, Storage } from '@angular/fire/storage';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class MediaFilesService {

  constructor(private firestore: Firestore, private storage: Storage) { }

  getVideos(): Observable<any[]> {
    console.log('Fetching videos from Firestore');
    const videosRef = collection(this.firestore, 'videos');
    const videos$ = collectionData(videosRef, { idField: 'id' }) as Observable<any[]>;
    
    videos$.subscribe({
      next: videos => console.log('Fetched videos:', videos),
      error: error => console.error('Error fetching videos:', error),
    });
    
    return videos$;
  }
  

  // File service code...
getFiles(): Observable<any[]> {
  const filesRef = collection(this.firestore, 'files');
  return collectionData(filesRef, { idField: 'id' }) as Observable<any[]>;
}

// New method for uploading files to a group's subcollection
async uploadFileToGroup(fileData: File, groupId: string): Promise<void> {
  const groupFilesRef = collection(this.firestore, `groups/${groupId}/files`);
  await addDoc(groupFilesRef, {...fileData});
}

// Method to fetch files by groupId from the subcollection
async getFilesByGroupId(groupId: string): Promise<any[]> {
  const groupFilesRef = collection(this.firestore, `groups/${groupId}/files`);
  const querySnapshot = await getDocs(groupFilesRef);
  const files = querySnapshot.docs.map(doc => doc.data());
  return files;
}





}
