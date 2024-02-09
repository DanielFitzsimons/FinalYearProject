import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, query, getDocs, doc, updateDoc, arrayUnion, deleteDoc, where} from '@angular/fire/firestore';
import { Team } from '../models/model/model';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  constructor(private firestore: Firestore) { }

  /* async createGroup(group: Team, creatorUserId: string): Promise<string> {
    const groupRef = collection(this.firestore, 'groups');
    const docRef = await addDoc(groupRef, group);
    // After creating the group, add the creator as a member
    await this.joinGroup(docRef.id, creatorUserId);
    return docRef.id;
  } */

  async createGroupAndChat(group: Team, creatorUserId: string): Promise<string> {
    // Create the group
    const groupRef = collection(this.firestore, 'groups');
    const docRef = await addDoc(groupRef, group);
    const groupId = docRef.id;
  
    // Create the corresponding chat document
    //const chatRef = collection(this.firestore, 'chats');
    const messagesRef = collection(this.firestore, `groups/${groupId}/messages`);
    await addDoc(messagesRef, {
      groupId: groupId,
      messages: [],
      members: [creatorUserId]
    });
  
    // Add the creator to the group's members
    await this.joinGroup(groupId, creatorUserId);
  
    return groupId;
  }


  
  async getGroups(): Promise<Team[]> {
    const groupsCollection = collection(this.firestore, 'groups');
    const groupsQuery = query(groupsCollection);
    const querySnapshot = await getDocs(groupsQuery);
    const groups: Team[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const group: Team = {
        id: id, // Set the id property
        groupName: data['groupName'],
        groupDescription: data['groupDescription'],
        members: data['members'],
        lastMessage: data['lastMessage']
      };
      groups.push(group);
    });
    return groups;
  }

  // GroupService

// Method to get groups for the current user
async getGroupsForUser(userId: string): Promise<Team[]> {
  const groupsCollection = collection(this.firestore, 'groups');
  // Query to find groups where the 'members' array contains the current user's ID
  const groupsQuery = query(groupsCollection, where('members', 'array-contains', userId));
  const querySnapshot = await getDocs(groupsQuery);
  const groups: Team[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data() as Team; // Cast the data to Team type
    const group: Team = {
      id: doc.id, // Set the id property
      groupName: data.groupName,
      groupDescription: data.groupDescription,
      members: data.members,
      lastMessage: data.lastMessage
    };
    groups.push(group);
  });
  return groups;
}

  
  async deleteGroup(groupId: string): Promise<void> {
    const groupRef = doc(this.firestore, 'groups', groupId);
    await deleteDoc(groupRef);
  }

  async joinGroupAndChat(groupId: string, userId: string): Promise<void> {
    // Join the group
    await this.joinGroup(groupId, userId);
  
    // Add user to the chat's members
    const chatQuery = query(collection(this.firestore, `groups/${groupId}/messages`), where('groupId', '==', groupId));
    const querySnapshot = await getDocs(chatQuery);
    if (!querySnapshot.empty) {
      const chatDocRef = querySnapshot.docs[0].ref;
      await updateDoc(chatDocRef, {
        members: arrayUnion(userId)
      });
    }
  }
  
  async joinGroup(groupId: string, userId: string): Promise<void> {
    const groupRef = doc(this.firestore, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId) // Add userId to the 'members' array
    });
  }
}
