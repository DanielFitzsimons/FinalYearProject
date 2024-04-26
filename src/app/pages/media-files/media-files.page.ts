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
    // Subscribe to the currentUser$ observable
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid; // Get the current user's ID
        console.log("Authenticated User ID:", this.currentUserId);

        // Subscribe to route parameters
        this.route.paramMap.subscribe(params => {
          const newGroupId = params.get('groupId'); // Get the groupId from route parameters
          console.log("Received new groupId from route:", newGroupId);

          // Check if a new groupId is received
          if (newGroupId && newGroupId !== this.groupId) {
            this.groupId = newGroupId; // Update the groupId
            console.log("Updated groupId to:", this.groupId);
            this.loadFilesForGroup(); // Load files for the new group
          } else if (!newGroupId) {
            console.error('No groupId provided in the route parameters.');
            this.presentAlert('Error', 'No group ID provided. Please navigate back and select a group.');
          }
        });
      } else {
        console.error('User not authenticated');
        this.router.navigate(['/login']); // Redirect to login page if user is not authenticated
      }
    });
  }
  
   // Load files for the current group
   loadFilesForGroup() {
    console.log("Attempting to load files for groupId:", this.groupId);
    this.mediaService.getFilesByGroupId(this.groupId).then(files => {
      console.log("Files loaded for groupId:", this.groupId, files);
      this.files = files; // Assign loaded files to component property
      this.groupedFiles = this.groupFilesByType(files); // Group files by type
      console.log("Grouped files:", this.groupedFiles);
    }).catch(error => {
      console.error('Error loading files:', error);
      this.presentAlert('Error', 'Failed to load files for the selected group.');
    });
  }



 // Determine file type based on file extension
 determineFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase(); // Get file extension
  if (!extension) {
    return 'other'; // Default to 'other' if no extension found
  }

  const extensionMap: { [key: string]: string } = { // Map extensions to file types
    'mp4': 'video', 'avi': 'video', 'mov': 'video', // Videos
    'xlsx': 'spreadsheet', 'xls': 'spreadsheet', // Spreadsheets
    'ppt': 'presentation', 'pptx': 'presentation', // Presentations
    'doc': 'document', 'docx': 'document', // Documents
  };

  return extensionMap[extension] || 'other'; // Default to 'other' if extension is not found
}

 // Upload file
 uploadFile(event: any) {
  const input = event.target as HTMLInputElement;
  const file = input.files ? input.files[0] : null; // Get uploaded file
  console.log("Preparing to upload file for groupId:", this.groupId);

  if (!this.groupId) {
    console.error('GroupId is not set. Cannot upload file.');
    return;
  }

  if (file) {
    const fileType = this.determineFileType(file.name); // Determine file type
    const filePath = `${fileType}/${new Date().getTime()}_${file.name}`; // Generate file path
    const fileRef = ref(this.storage, filePath); // Create file reference
    const groupFilesRef = collection(this.firestore, `groups/${this.groupId}/files`); // Create group files reference

    console.log('Starting file upload:', file.name, 'to groupId:', this.groupId);
    // Upload file to storage
    uploadBytes(fileRef, file).then(uploadResult => {
      // Get download URL for the uploaded file
      getDownloadURL(uploadResult.ref).then(downloadURL => {
        const fileMetadata = { // Prepare file metadata
          url: downloadURL,
          name: file.name,
          createdAt: new Date(),
          type: fileType
        };
        addDoc(groupFilesRef, fileMetadata); // Add file metadata to Firestore
        console.log('File uploaded and metadata stored:', fileMetadata);
      }).catch(error => console.error("Error getting download URL:", error));
    }).catch(error => console.error("Upload failed:", error));
  } else {
    console.log('No file selected for upload.');
  }
}

// Group files by type
private groupFilesByType(files: any[]): { [key: string]: any[] } {
  const grouped: { [key: string]: any[] } = {}; // Initialize grouped object
  files.forEach(file => {
    const type = file.type || 'other'; // Get file type or default to 'other'
    if (!grouped[type]) {
      grouped[type] = []; // Initialize array if not exists
    }
    grouped[type].push(file); // Push file to corresponding type array
  });
  return grouped; // Return grouped object
}

// Get keys of an object
public getObjectKeys(obj: object): string[] {
  return Object.keys(obj); // Return keys of the object
}

// Present alert
async presentAlert(header: string, message: string) {
  const alert = await this.alertController.create({
    header: header,
    message: message,
    buttons: ['OK']
  });

  await alert.present(); // Display the alert
}

// Navigate to group detail page
async navigateToGroupDetail(groupId: string) {
  // Use matrix URL notation for optional route parameters
  this.router.navigate(['/group-detail', { id: groupId }]);
}


}


