import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, query, where, getDocs, doc, updateDoc, arrayUnion, DocumentData } from '@angular/fire/firestore';
import { Team } from '../models/model/model';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  constructor(private firestore: Firestore) { }

  async createGroup(group: Team): Promise<string> {
    const groupRef = collection(this.firestore, 'groups');
    const docRef = await addDoc(groupRef, group);
    return docRef.id;
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
        members: data['members']
      };
      groups.push(group);
    });
    return groups;
  }
  
  
  
  async joinGroup(groupId: string, userId: string): Promise<void> {
    const groupRef = doc(this.firestore, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId) // Add userId to the 'members' array
    });
  }
}
