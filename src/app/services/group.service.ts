import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, query, getDocs, doc, updateDoc, arrayUnion, deleteDoc, where, getDoc, serverTimestamp} from '@angular/fire/firestore';
import { Team, Post, Message } from '../models/model/model';
import { Observable, from, map, switchMap, of, forkJoin } from 'rxjs';
import { orderBy, limit } from '@angular/fire/firestore';
import { catchError } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

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

// Method to create a group and its corresponding chat
async createGroupAndChat(group: Team, creatorUserId: string): Promise<string> {
  // Create the group with the creator as a member
  const groupWithCreator = { ...group, creatorId: creatorUserId };
  const groupRef = collection(this.firestore, 'groups');
  const docRef = await addDoc(groupRef, groupWithCreator);
  const groupId = docRef.id;

  // Create the corresponding chat document
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
  

  
  // Method to retrieve the last message for a group
  async getLastMessageForGroup(groupId: string): Promise<Message | null> {
    const messagesRef = collection(this.firestore, `groups/${groupId}/messages`);
    const lastMessageQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(lastMessageQuery);
  
    if (!querySnapshot.empty) {
        const lastMessageData = querySnapshot.docs[0].data() as Message;
        // Convert Firestore timestamp to JavaScript Date object if necessary
        if (lastMessageData.timestamp && lastMessageData.timestamp instanceof Timestamp) {
            lastMessageData.timestamp = lastMessageData.timestamp.toDate();
        }
        return lastMessageData;
    } else {
        return null;
    }
}
 // Method to get groups with the last message for a user
 getGroupsWithLastMessage(userId: string): Observable<Team[]> {
  return this.getGroupsForUser(userId).pipe(
    switchMap((groups) => {
      return forkJoin(
        groups.map(async (group) => {
          if (!group.id) {
            throw new Error('Group ID is undefined');
          }
          try {
            const lastMessage = await this.getLastMessageForGroup(group.id);
            let lastMessageContent = '';
            let lastMessageTimestamp: Date | null = null;
            let hasNewMessages = false; // Initialize the new message indicator

            if (lastMessage) {
              lastMessageContent = lastMessage.content || 'No messages yet.';
            
              // Convert Firestore timestamp to JavaScript Date object if necessary
              if (lastMessage.timestamp instanceof Date) {
                lastMessageTimestamp = lastMessage.timestamp;
              } else if (lastMessage.timestamp && lastMessage.timestamp instanceof Timestamp) {
                lastMessageTimestamp = lastMessage.timestamp.toDate();
              }
            } else {
              lastMessageContent = 'No messages yet.';
            }

            return {
              ...group,
              lastMessageContent, //return the content of the last message
              lastMessageTimestamp, //return its time stamp
              hasNewMessages, //show user has new message
            };
          } catch (error) {
            console.error('Error fetching last message for group:', error);
            //return data as null if nothing is fetched
            return {
              ...group,
              lastMessageContent: 'Error fetching messages.',
              lastMessageTimestamp: null,
              hasNewMessages: false, 
            };
          }
        })
      );
    }),
    catchError((error) => {
      console.error('Error in getGroupsWithLastMessage:', error);
      return of([]); // Return an empty array as a default value
    })
  );
}

  
    // Method to retrieve all groups
    async getGroups(): Promise<Team[]> {
      // Retrieve all groups from Firestore
      const groupsCollection = collection(this.firestore, 'groups');
      const groupsQuery = query(groupsCollection);
      const querySnapshot = await getDocs(groupsQuery);
      const groups: Team[] = [];
      // Iterate through each document in the query snapshot
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        // Extract group data from document and create Team object
        const group: Team = {
          id: id, // Set the id property
          groupName: data['groupName'],
          groupDescription: data['groupDescription'],
          members: data['members'],
          lastMessage: data['lastMessage'],
          creatorId: data['creatorId']
        };
        // Push the group object to the groups array
        groups.push(group);
      });
      // Return the array of groups
      return groups;
    }
  

// Method to retrieve a group by its ID
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


// Method to retrieve groups for a specific user
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

// Method to delete a group
async deleteGroup(groupId: string, userId: string): Promise<void> {
  // Get the reference to the document for the specified group ID
  const groupRef = doc(this.firestore, 'groups', groupId);
  // Retrieve the snapshot of the group document
  const groupSnapshot = await getDoc(groupRef);

  // Check if the group document exists
  if (!groupSnapshot.exists()) {
    // If the group document doesn't exist, throw an error
    throw new Error('Group not found');
  }

  // Extract the group data from the snapshot
  const group = groupSnapshot.data() as Team;
  // Check if the user is the creator of the group
  if (group.creatorId !== userId) {
    // If the user is not the creator, throw an error
    throw new Error('Only the creator of this group can delete it');
  }

  // Delete the group document
  await deleteDoc(groupRef);
}

// Method to join a group and its chat
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

  
 // Method to join a group
async joinGroup(groupId: string, userId: string): Promise<void> {
  // Get the reference to the document for the specified group ID
  const groupRef = doc(this.firestore, 'groups', groupId); // Reference to the collection of groups
  // Update the document by adding the user ID to the 'members' array
  await updateDoc(groupRef, {
    members: arrayUnion(userId) // Add userId to the 'members' array
  });
}

// Method to add a post to a group
async addPostToGroup(post: Omit<Post, 'id'>): Promise<void> {
  // Get the reference to the collection of posts for the specified group
  const postRef = collection(this.firestore, `groups/${post.groupId}/posts`);
  // Add a document to the posts collection with the provided post data
  await addDoc(postRef, {
    ...post,
    timestamp: serverTimestamp() // Use Firebase's server timestamp
  });
}


  // Method to retrieve posts by group ID
async getPostsByGroupId(groupId: string): Promise<any[]> {
  // Get the reference to the document for the specified group ID
  const groupDocRef = doc(this.firestore, 'groups', groupId);
  // Retrieve the snapshot of the group document
  const groupSnapshot = await getDoc(groupDocRef);

  // Check if the group document exists
  if (!groupSnapshot.exists()) {
      // If the group document doesn't exist, throw an error
      throw new Error('Group not found');
  }

  // Extract the group name from the group document data
  const groupName = groupSnapshot.data()?.['groupName']; // Assuming 'groupName' is the field containing the group name

  // Get the reference to the collection of posts for the specified group
  const postsCollection = collection(this.firestore, `groups/${groupId}/posts`);
  // Retrieve the snapshot of the posts collection
  const postsSnapshot = await getDocs(postsCollection);
  // Map each post document to an object containing its ID, data, and the group name
  const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), groupName }));

  // Log the retrieved data for debugging purposes
  console.log(`Data for group ${groupId}:`, postsData);

  // Return the array of posts data
  return postsData;
}

  
}
