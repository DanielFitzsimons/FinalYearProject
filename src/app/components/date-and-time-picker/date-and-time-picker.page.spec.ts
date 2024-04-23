import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateAndTimePickerPage } from './date-and-time-picker.page';

describe('DateAndTimePickerPage', () => {
  let component: DateAndTimePickerPage;
  let fixture: ComponentFixture<DateAndTimePickerPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(DateAndTimePickerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
