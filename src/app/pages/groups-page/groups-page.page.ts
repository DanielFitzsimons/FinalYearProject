import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { GroupService } from 'src/app/services/group.service'
import { Team, User } from 'src/app/models/model/model';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { firstValueFrom } from 'rxjs';
import { Router} from '@angular/router';

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

  allGroups: Team[] = [];

  userGroups: Team[] = [];
  
  searchPerformed = false;

  currentUser: User | null = null;
  



  constructor(private fb: FormBuilder, private groupService: GroupService, private userService: UserProfileService, private auth: AuthenticationService, private router: Router ) {}

  ngOnInit() {
    // Inside a component that needs user information
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        // User is signed in
        
        console.log(user);
        this.fetchUserGroups();
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
      this.allGroups = await this.groupService.getGroups(); // Fetch all groups
      this.groups = [...this.allGroups]; // Initially, display all groups or you could choose to display none
      console.log('Fetched groups:', this.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }
  
  
  async fetchUserGroups() {
    try {
      const user = await firstValueFrom(this.auth.getCurrentUser());
      if (user && user.uid) {
        this.groupService.getGroupsForUser(user.uid).subscribe(
          (userGroups: Team[]) => {
            this.userGroups = userGroups;
            console.log('Fetched user groups:', this.userGroups);
          },
          error => {
            console.error('Error fetching user groups:', error);
            this.userGroups = []; // Clear the userGroups in case of an error
          }
        );
      } else {
        console.error('User is not logged in or UID is unavailable');
        this.userGroups = []; // Clear the userGroups if not logged in
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  }
  
  


  async joinGroup(group: Team | undefined) {
    if (group && group.id) {
      const user = await firstValueFrom(this.auth.getCurrentUser());
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


  async deleteGroup(group: Team) {
    const currentUser = await firstValueFrom(this.auth.getCurrentUser());
    if (!currentUser || !currentUser.uid) {
      console.error('User not logged in or UID is unavailable');
      return;
    }
    
    // Check if the current user is the creator of the group before attempting to delete
    if (group.id && group.creatorId === currentUser.uid) {
      try {
        await this.groupService.deleteGroup(group.id, currentUser.uid);
        console.log('Group deleted successfully');
        this.userGroups = this.userGroups.filter(g => g.id !== group.id);
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    } else {
      console.error('Group ID is undefined. Cannot delete group.');
    }
  }
  
  isUserGroupCreator(group: Team): boolean {
    console.log(group.creatorId);
    return group.creatorId === this.currentUser?.uid;
  }
  

  filterGroups(event: any) {
    const searchTerm = event.detail.value.toLowerCase();
    this.searchPerformed = true; // Indicate a search has been performed
  
    if (!searchTerm.trim()) {
      this.groups = []; // Option to reset the displayed groups based on your UX choice
    } else {
      // Filter allGroups based on the search term, not considering membership
      this.groups = this.allGroups.filter(group => {
        return group.groupName.toLowerCase().includes(searchTerm) ||
               (group.groupDescription && group.groupDescription.toLowerCase().includes(searchTerm));
      });
    }
  }
  

  async onSubmit() {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;
      const groupName = formValue.groupName ?? '';
      const groupDescription = formValue.groupDescription ?? '';
      const user = await firstValueFrom(this.auth.getCurrentUser());
      
      if (user && user.uid) {
        try {
          const groupId = await this.groupService.createGroupAndChat({
            groupName,
            groupDescription,
            members: [], // Initially empty, creator will be added in service
            lastMessage: '',
            creatorId: user.uid
          }, user.uid);
  
          console.log('Group created with ID:', groupId);
        } catch (error) {
          console.error('Error creating group:', error);
        }
      } else {
        console.error('Error: User ID is null. Cannot create group.');
      }
    }
  }

async goToGroupPage(group: Team) {
  // Assuming you have a route set up for 'group-detail' page
  this.router.navigate(['/group-detail', { id: group.id }]);
}

}
