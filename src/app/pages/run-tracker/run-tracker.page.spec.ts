import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RunTrackerPage } from './run-tracker.page';

describe('RunTrackerPage', () => {
  let component: RunTrackerPage;
  let fixture: ComponentFixture<RunTrackerPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(RunTrackerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
