import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
@Component({
  selector: 'app-date-and-time-picker',
  templateUrl: './date-and-time-picker.page.html',
  styleUrls: ['./date-and-time-picker.page.scss'],
})
export class DateAndTimePickerPage implements OnInit {

  startTime: string = '';
  endTime: string = '';

  constructor(public modalController: ModalController) {}

  ngOnInit() {
    
  }
  confirmSelection() {
    this.modalController.dismiss({
      startTime: this.startTime,
      endTime: this.endTime
    });
  }


}
