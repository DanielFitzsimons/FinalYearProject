import { Component, OnInit } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Firestore, addDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { MediaFilesService } from 'src/app/services/media-files.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Team } from 'src/app/models/model/model';
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


  constructor(private storage: Storage, private firestore: Firestore, private mediaService: MediaFilesService, private auth: AuthenticationService,
    private route: ActivatedRoute, private router: Router, private alertController: AlertController
  ) { }

  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid;
        console.log("Authenticated User ID:", this.currentUserId);

        this.route.paramMap.subscribe(params => {
          const newGroupId = params.get('groupId');
          console.log("Received new groupId from route:", newGroupId);

          if (newGroupId && newGroupId !== this.groupId) {
            this.groupId = newGroupId;
            console.log("Updated groupId to:", this.groupId);
            this.loadFilesForGroup();
          } else if (!newGroupId) {
            console.error('No groupId provided in the route parameters.');
            this.presentAlert('Error', 'No group ID provided. Please navigate back and select a group.');
          }
        });

      } else {
        console.error('User not authenticated');
        this.router.navigate(['/login']);
      }
    });
}
  
  loadFilesForGroup() {
    console.log("Attempting to load files for groupId:", this.groupId);
    this.mediaService.getFilesByGroupId(this.groupId).then(files => {
        console.log("Files loaded for groupId:", this.groupId, files);
        this.files = files;
        this.groupedFiles = this.groupFilesByType(files);
        console.log("Grouped files:", this.groupedFiles);
    }).catch(error => {
        console.error('Error loading files:', error);
        this.presentAlert('Error', 'Failed to load files for the selected group.');
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

uploadFile(event: any) {
  const input = event.target as HTMLInputElement;
  const file = input.files ? input.files[0] : null;
  console.log("Preparing to upload file for groupId:", this.groupId);

  if (!this.groupId) {
      console.error('GroupId is not set. Cannot upload file.');
      return;
  }

  if (file) {
      const fileType = this.determineFileType(file.name);
      const filePath = `${fileType}/${new Date().getTime()}_${file.name}`;
      const fileRef = ref(this.storage, filePath);
      const groupFilesRef = collection(this.firestore, `groups/${this.groupId}/files`);

      console.log('Starting file upload:', file.name, 'to groupId:', this.groupId);
      uploadBytes(fileRef, file).then(uploadResult => {
          getDownloadURL(uploadResult.ref).then(downloadURL => {
              const fileMetadata = {
                  url: downloadURL,
                  name: file.name,
                  createdAt: new Date(),
                  type: fileType
              };
              addDoc(groupFilesRef, fileMetadata);
              console.log('File uploaded and metadata stored:', fileMetadata);
          }).catch(error => console.error("Error getting download URL:", error));
      }).catch(error => console.error("Upload failed:", error));
  } else {
      console.log('No file selected for upload.');
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



public getObjectKeys(obj: object): string[] {
  return Object.keys(obj);
}

  
async presentAlert(header: string, message: string) {
  const alert = await this.alertController.create({
    header: header,
    message: message,
    buttons: ['OK']
  });

  await alert.present();
}

async navigateToGroupDetail(groupId: string) {
  // Use matrix URL notation for optional route parameters
  this.router.navigate(['/group-detail', { id: groupId }]);
}


}


