import { Component, OnInit } from '@angular/core';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection } from 'firebase/firestore';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
})
export class TasksPage implements OnInit {

  tasks$ = collectionData(collection(this.firestore, 'tasks')) as Observable<Task[]>

  constructor(private readonly firestore: Firestore) { }

  ngOnInit() {
  }

}

export interface Task{
  id: string;
  title: string;
  description: string;
}
