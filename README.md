# Social Fitness App

![Logo of Social Fitness App](/socialFitnessLogo.png)


## Description
The Social Fitness App is a comprehensive platform designed for the fitness community. It provides a robust and user-friendly platform for community-based fitness tracking and social interaction.

## Features
- User Authentication System: Secure login/logout, account creation, and password recovery using Firebase Authentication.
- Profile Personalization: Users can create personalized profiles and upload profile pictures.
- Real-Time Messaging: Enables users to communicate with others in their fitness community using Firebase Realtime Database.
- Run Tracker: Integrates with Google Maps API to visualize running routes and track performance.
- Gym Workout Tracker: Uses the Google Fit API to log gym sessions and fetch health data for analysis.
- Media Files Management: Allows users to upload and share multimedia files within their specific fitness groups.

## Technologies Used
- Front-End: Ionic with Angular
- Backend: Firebase (Authentication, Realtime Database, Cloud Functions)
- Mapping Services: Google Maps API
- Health Data: Google Fit API

## Setup/Installation
To set up the project on your local machine:
1. Clone the repository using `git clone [https://github.com/DanielFitzsimons/FinalYearProject]`.
2. Install the necessary dependencies with `npm install`.
3. Set up your Firebase (follow the section labelled "Firebase Setup" and Google Maps API keys in the environment variables.
4. Run the application using `ionic serve`.

## Firebase Setup
To use this app, you will need to set up Firebase:

1. Visit [Firebase Console](https://console.firebase.google.com/) and create a new Firebase project if you don't already have one.
2. Once your project is created, navigate to the project settings and add a new web application.
3. Configure the Firebase Authentication, Realtime Database, and other services used in the app through the Firebase console.
4. Install Firebase CLI globally by running `npm install -g firebase-tools`.
5. Log in to the Firebase CLI with `firebase login` and follow the on-screen instructions to authenticate.
6. Initialize your project with `firebase init` and select the features you are using (e.g., Authentication, Realtime Database, Hosting, Functions).
7. Update the `.firebaserc` file with your project ID and update the `firebase.json` as needed for your app's configuration.

## Usage
After installing the app, you can:
- Sign up or log in to access your personal fitness dashboard.
- Track your runs and gym workouts.
- Communicate with your fitness community.
- Share and view media files related to your fitness activities.

## Acknowledgments
- Google Maps for providing the mapping services that allow our users to track their fitness activities.
- Firebase for hosting the backend services that power our community features.
- Google Fit API for enabling our users to log and analyze their health data.

For more information about the development process and detailed documentation, refer to the provided `docs/` directory.
