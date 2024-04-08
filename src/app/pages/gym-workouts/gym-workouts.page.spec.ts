import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GymWorkoutsPage } from './gym-workouts.page';

describe('GymWorkoutsPage', () => {
  let component: GymWorkoutsPage;
  let fixture: ComponentFixture<GymWorkoutsPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(GymWorkoutsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
