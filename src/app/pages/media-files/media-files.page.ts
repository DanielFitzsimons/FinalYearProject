import { Component, OnInit } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Firestore, addDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { MediaFilesService } from 'src/app/services/media-files.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
@Component({
  selector: 'app-media-files',
  templateUrl: './media-files.page.html',
  styleUrls: ['./media-files.page.scss'],
})
export class MediaFilesPage implements OnInit {

  videos: any[] = [];
  groupedFiles: { [key: string]: any[] } = {};
  files: any[] = [];
  groupId: string = ''

  currentUserId?: string;


  constructor(private storage: Storage, private firestore: Firestore, private mediaService: MediaFilesService, private auth: AuthenticationService) { }

  ngOnInit() {
  
      this.auth.currentUser$.subscribe( // Listen for changes in the current user's authentication state
      user => {
        if (user) {
          // User is authenticated
          this.currentUserId = user.uid; // Store the current user's ID
          console.log(this.currentUserId)
          this.getUserGroups();
        } else {
          // User is not authenticated
          console.error('User not authenticated');
        
        }
      },
      error => {
        console.error('Error in authentication:', error);
      }
    );

    this.mediaService.getFilesByGroupId(this.groupId).then(files => {
      this.files = files;
      this.groupedFiles = this.groupFilesByType(files);
    }).catch(error => {
      console.error('Error loading files:', error);
    });
  }
  
  getUserGroups() {
    const groupsQuery = query(collection(this.firestore, 'groups'), where('members', 'array-contains', this.currentUserId));
    getDocs(groupsQuery).then(querySnapshot => {
      if (!querySnapshot.empty) {
        // Assume you want the first group, or let the user select a group
        this.groupId = querySnapshot.docs[0].id;
        console.log('Current group set to:', this.groupId);
  
        // Now you can load files for this group
        this.mediaService.getFilesByGroupId(this.groupId).then(files => {
          this.files = files;
          this.groupedFiles = this.groupFilesByType(files);
        }).catch(error => {
          console.error('Error loading files:', error);
        });
  
      } else {
        console.error('User is not part of any groups');
      }
    }).catch(error => {
      console.error('Error getting groups:', error);
    });
  }
  

 // Function to determine file type based on the file extension
 determineFileType(fileName: string): string {
  // Make sure there's a file extension to work with
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) {
    return 'other'; // Default to 'other' if there's no file extension
  }

  // Map extensions to file types
  const extensionMap: { [key: string]: string } = {
    'mp4': 'video', 'avi': 'video', 'mov': 'video', // Videos
    'xlsx': 'spreadsheet', 'xls': 'spreadsheet', // Spreadsheets
    'ppt': 'presentation', 'pptx': 'presentation', // Presentations
    'doc': 'document', 'docx': 'document', // Documents
    // Add more mappings as needed
  };

  return extensionMap[extension] || 'other'; // Default to 'other' if extension is not found
}

async uploadFile(event:any) {
  const input = event.target as HTMLInputElement;
  const file = input.files ? input.files[0] : null;

  if (!this.groupId) {
    console.error('GroupId is not set. Cannot upload file.');
    return;
  }

  if (file) {
    const fileType = this.determineFileType(file.name);
    const filePath = `${fileType}/${new Date().getTime()}_${file.name}`;
    const fileRef = ref(this.storage, filePath);
    console.log('Starting upload for:', file.name);
    const groupFilesRef = collection(this.firestore, `groups/${this.groupId}/files`);

    try {
      const uploadResult = await uploadBytes(fileRef, file);
      console.log('Upload success:', uploadResult);
      
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('File available at', downloadURL);
      
      // Store file metadata including the file type in Firestore
      const fileMetadata = {
        url: downloadURL,
        name: file.name,
        createdAt: new Date(),
        type: fileType
      };
     
      await addDoc(groupFilesRef, fileMetadata);
      console.log('Metadata stored for:', file.name);

    } catch (error) {
      console.error("Upload failed", error);
    }
  } else {
    console.log('No file selected');
  }
}

private groupFilesByType(files: any[]): { [key: string]: any[] } {
  const grouped: { [key: string]: any[] } = {}; // Explicitly type 'grouped' as a dictionary
  files.forEach(file => {
    const type = file.type || 'other';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(file);
  });
  return grouped;
}

// In your component class

public getObjectKeys(obj: object): string[] {
  return Object.keys(obj);
}

  
  

}


