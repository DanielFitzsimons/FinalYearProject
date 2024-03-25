import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, query, getDocs, doc, updateDoc, arrayUnion, deleteDoc, where, getDoc, serverTimestamp} from '@angular/fire/firestore';
import { Team, Post } from '../models/model/model';
import { Observable, from, map } from 'rxjs';
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
    const groupWithCreator = { ...group, creatorId: creatorUserId };
    const groupRef = collection(this.firestore, 'groups');
    const docRef = await addDoc(groupRef, groupWithCreator);
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
        lastMessage: data['lastMessage'],
        creatorId: data['creatorId']
      };
      groups.push(group);
    });
    return groups;
  }

async getGroupById(groupId: string): Promise<Team> {
  const groupDocRef = doc(this.firestore, 'groups', groupId);
  const groupSnapshot = await getDoc(groupDocRef);

  if (groupSnapshot.exists()) {
    // If the document exists in the collection, cast it to the Team type and return it
    const group = groupSnapshot.data() as Team;
    group.id = groupSnapshot.id; // Make sure to set the ID
    return group;
  } else {
    // Handle the case where the group does not exist
    throw new Error('Group not found');
  }
}


// Method to get groups for the current user
getGroupsForUser(userId: string): Observable<Team[]> {
  const groupsCollection = collection(this.firestore, 'groups');
  const groupsQuery = query(groupsCollection, where('members', 'array-contains', userId));
  
  // Convert the promise-based query to an observable
  return from(getDocs(groupsQuery)).pipe(
    map(querySnapshot => {
      const groups: Team[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Team;
        const group: Team = {
          id: doc.id,
          groupName: data.groupName,
          groupDescription: data.groupDescription,
          members: data.members,
          lastMessage: data.lastMessage,
          creatorId: data.creatorId
        };
        groups.push(group);
      });
      return groups;
    })
  );
}

  
async deleteGroup(groupId: string, userId: string): Promise<void> {
  const groupRef = doc(this.firestore, 'groups', groupId);
  const groupSnapshot = await getDoc(groupRef);

  if (!groupSnapshot.exists()) {
    throw new Error('Group not found');
  }

  const group = groupSnapshot.data() as Team;
  if (group.creatorId !== userId) {
    throw new Error('Only the creator of this group can delete it');
  }

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

   // Method to add a post to a group
   async addPostToGroup(post: Omit<Post, 'id'>): Promise<void> {
    const postRef = collection(this.firestore, `groups/${post.groupId}/posts`);
    await addDoc(postRef, {
      ...post,
      timestamp: serverTimestamp() // Use Firebase's server timestamp
    });
  }

  async getPostsByGroupId(groupId: string): Promise<any[]> {
    const groupDocRef = doc(this.firestore, 'groups', groupId);
    const groupSnapshot = await getDoc(groupDocRef);
  
    if (!groupSnapshot.exists()) {
      throw new Error('Group not found');
    }
  
    const groupName = groupSnapshot.data()?.['groupName']; // Assuming 'groupName' is the field containing the group name
  
    const postsCollection = collection(this.firestore, `groups/${groupId}/posts`);
    const postsSnapshot = await getDocs(postsCollection);
    const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), groupName }));
  
    console.log(`Data for group ${groupId}:`, postsData); // Add this line to log the data
  
    return postsData;
  }
  
}
