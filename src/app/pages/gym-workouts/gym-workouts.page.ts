import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gym-workouts',
  templateUrl: './gym-workouts.page.html',
  styleUrls: ['./gym-workouts.page.scss'],
})
export class GymWorkoutsPage implements OnInit {

  currentExercise: string = '';
  numberOfSets: number = 0;
  numberOfReps: number = 0;
  heartRate: number = 0; // This will be updated with real data from the smartwatch
  workoutDuration: number = 0; // Duration in seconds
  workoutTimer: any; // This will hold our interval for the workout timer

  constructor() { }

  ngOnInit() {
  }

  startWorkout() {
    // Initialize or reset workout parameters
    this.heartRate = 0; // This would come from the smartwatch
    this.workoutDuration = 0; // Reset workout duration
    this.startTimer();
  }

  startTimer() {
    const startTime = Date.now() - this.workoutDuration; // If resuming, subtract the already elapsed time
    this.workoutTimer = setInterval(() => {
      const currentTime = Date.now();
      this.workoutDuration = (currentTime - startTime) / 1000; // Update duration in seconds
    }, 1000);
  }

  stopTimer() {
    if (this.workoutTimer) {
      clearInterval(this.workoutTimer);
    }
  }

  endWorkout() {
    this.stopTimer();
    // Here you would handle the logic to save the workout data
    // For now, we'll just log it to the console
    console.log('Workout ended. Duration:', this.formatTime(this.workoutDuration), 'Heart Rate:', this.heartRate);
  }

  formatTime(durationInSeconds: number): string {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
  }


}
