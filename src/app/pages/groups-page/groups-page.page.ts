import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { GroupService } from 'src/app/services/group.service'
import { Team, User } from 'src/app/models/model/model';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
@Component({
  selector: 'app-groups-page',
  templateUrl: './groups-page.page.html',
  styleUrls: ['./groups-page.page.scss'],
})
export class GroupsPagePage implements OnInit {

  groupForm = this.fb.group({
    groupName: ['', Validators.required],
    groupDescription: ['']
  });

  groups: Team[] = [];


  constructor(private fb: FormBuilder, private groupService: GroupService, private userService: UserProfileService, private auth: AuthenticationService ) {}

  ngOnInit() {
    this.fetchGroups();
  }

  /* async fetchGroups(){
    try{
      this.groups = await this.groupService.getGroups();
      console.log('Fetched groups:', this.groups);

    }catch(error){
      console.error('Error fetching groups: ', error);
    }
  } */

  async fetchGroups() {
    try {
      this.groups = await this.groupService.getGroups();
      for (const group of this.groups) {
        for (let i = 0; i < group.members.length; i++) {
          const userId = group.members[i];
          // Wrap the observable handling in a promise to use await
          const user = await new Promise<any>((resolve, reject) => {
            this.userService.getUserProfile(userId).subscribe({
              next: (userData) => resolve(userData),
              error: (error) => reject(error)
            });
          });
          // Now you can access user.name assuming the user data has a 'name' property
          group.members[i] = user ? user.name : 'Unknown User';
        }
      }
      console.log('Fetched groups:', this.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }
  

  async joinGroup(group: Team) {
    const user = this.auth.getCurrentUser(); // This should be a Firebase User object
  
    // Check if the user object and user.uid are available
    if (!user || !user.uid) {
      console.error('User is not logged in or UID is unavailable');
      return;
    }
  
    try {
      if (group.id) {
        // Now correctly using user.uid, which is a string
        await this.groupService.joinGroup(group.id, user.uid); // Pass the user's UID here
        console.log('Joined group:', group.groupName);
      } else {
        console.error('Error joining group: Group ID is undefined');
      }
    } catch (error) {
      console.error('Error joining group:', error);
    }
  }
  
  
  

  async onSubmit() {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;
  
      // Provide default values for groupName and groupDescription if they are null or undefined
      const groupName = formValue.groupName ?? ''; // Use an empty string or another default value as appropriate
      const groupDescription = formValue.groupDescription ?? ''; 
  
      try {
        const groupId = await this.groupService.createGroup({
          groupName, // Ensured to be a string
          groupDescription, // Ensured to be a string
          members: [] // Initially empty, or add creator's ID
        });
        console.log('Group created with ID:', groupId);
        
      } catch (error) {
        console.error('Error creating group:', error);
        
      }
    }
  }
  

}
