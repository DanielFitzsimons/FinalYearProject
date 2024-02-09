import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { GroupService } from 'src/app/services/group.service'
import { Team } from 'src/app/models/model/model';
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
    // Inside a component that needs user information
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        // User is signed in
        console.log(user);
      } else {
        // User is null, meaning not signed in or the state has not been restored yet
        console.log('User is not signed in');
      }
    });

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
  

  async joinGroup(group: Team | undefined) {
    // First, check if 'group' and 'group.id' are defined
    if (group && group.id) {
      const user = this.auth.getCurrentUser(); // Ensure this returns a non-null User object
  
      if (user && user.uid) {
        try {
          await this.groupService.joinGroupAndChat(group.id, user.uid);
          console.log('Joined group and chat:', group.groupName);
        } catch (error) {
          console.error('Error joining group and chat:', error);
        }
      } else {
        console.error('User is not logged in or UID is unavailable');
      }
    } else {
      console.error('The group or group ID is undefined. Cannot join group.');
    }
  }
  
  

  async deleteGroup(groupId: string | undefined) {
    if (!groupId) {
      console.error('Error: groupId is undefined. Cannot delete group.');
      return;
    }
    
    try {
      await this.groupService.deleteGroup(groupId);
      console.log('Group deleted successfully');
      this.groups = this.groups.filter(group => group.id !== groupId);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  }
  
  
  
  
  async onSubmit() {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;
      const groupName = formValue.groupName ?? '';
      const groupDescription = formValue.groupDescription ?? '';
      const creatorUserId = this.auth.getCurrentUser(); // Ensure this returns a non-null User object
  
      if (creatorUserId && creatorUserId.uid) {
        try {
          const groupId = await this.groupService.createGroupAndChat({
            groupName,
            groupDescription,
            members: [] ,// Initially empty, creator will be added in service
            lastMessage: ''
          }, creatorUserId.uid);
  
          console.log('Group created with ID:', groupId);
        } catch (error) {
          console.error('Error creating group:', error);
        }
      } else {
        console.error('Error: User ID is null. Cannot create group.');
      }
    }
  }
  
  
  

}
