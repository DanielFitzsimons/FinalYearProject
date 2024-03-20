import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { GroupService } from 'src/app/services/group.service'
import { Team } from 'src/app/models/model/model';
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

  searchPerformed = false;



  constructor(private fb: FormBuilder, private groupService: GroupService, private userService: UserProfileService, private auth: AuthenticationService, private router: Router ) {}

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


/* async fetchGroups() {
  this.allGroups = this.groups = await this.groupService.getGroups();

  try {
    this.groups = await this.groupService.getGroups();
    const memberInfoPromises = this.groups.map(group =>
      Promise.all(group.members.map(userId =>
        firstValueFrom(this.userService.getUserProfile(userId))
      ))
    );
    const membersInfo = await Promise.all(memberInfoPromises);
    this.groups.forEach((group, index) => {
      group.members = membersInfo[index].map(user => user ? user.name : 'Unknown User');
    });
    console.log('Fetched groups:', this.groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
  }
}*/

async fetchGroups() {
  try {
    // Assuming getGroups fetches all available groups
    const allGroups = await this.groupService.getGroups();
    const user = await firstValueFrom(this.auth.getCurrentUser());

    if (user && user.uid) {
      // Filter groups to include only those where the current user is a member
      this.groups = allGroups.filter(group => group.members.includes(user.uid));
    } else {
      console.error('User is not logged in or UID is unavailable');
      this.groups = []; // Clear the groups or handle as needed when user is not logged in
    }

    console.log('Fetched groups:', this.groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
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

  filterGroups(event: any) {
  const searchTerm = event.detail.value.toLowerCase();
  this.searchPerformed = true; // Update flag to indicate a search has been performed

  if (!searchTerm.trim()) {
    // Consider whether to reset to all groups or display none based on your requirements
    this.groups = []; // Don't display any groups if no search term is entered
  } else {
    // Filter groups based on the search term
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
            lastMessage: ''
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


  // Inside GroupsPagePage class

async goToGroupPage(group: Team) {
  // Assuming you have a route set up for 'group-detail' page
  this.router.navigate(['/group-detail', { id: group.id }]);
}

  
  
  
  

}
