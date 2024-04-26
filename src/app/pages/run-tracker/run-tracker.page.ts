import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { RunData } from 'src/app/models/model/model';
import  { UserProfileService} from 'src/app/services/user-profile.service'
import { AlertController, PopoverController } from '@ionic/angular';
import { RunSummaryPopoverComponent } from 'src/app/components/run-summary-popover/run-summary-popover.component';
import { google } from 'google-maps'

@Component({
  selector: 'app-run-tracker',
  templateUrl: './run-tracker.page.html',
  styleUrls: ['./run-tracker.page.scss'],
})
export class RunTrackerPage implements OnInit, AfterViewInit {
  // Properties to hold the map, user marker, and selected run distance
  map?: google.maps.Map;
  userMarker?: google.maps.Marker;
  selectedRunDistance!: number;

  watchId: any;

  startTime: Date | null = null;
  totalDistance = 0; // Total distance in meters
  previousPosition: google.maps.LatLng | null = null;

  timer: any = null;
  elapsedTime: string = "00:00:00";
  diff: number = 0;

  startLocation: google.maps.LatLng | null = null;
  distanceFromStart: number = 0;  // Distance in meters

  constructor(private http: HttpClient, 
    private auth: AuthenticationService,
    private changeDetectorRef: ChangeDetectorRef, 
    private userProfileService: UserProfileService,
    private alertController: AlertController,
    private popoverController: PopoverController) {}

  ngOnInit() {
    this.requestPermissions();
  }

  ngAfterViewInit() {
    // Inside a component that needs user information
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        // User is signed in
        console.log(user);
      } else {
        // User is null, meaning not signed in or the state has not been restored yet
        console.log('User is not signed in');
      }
    });

    // Load the map and set the current position after the view has been initialized
    this.loadMap();
    
    this.setCurrentPosition();

    this.checkPermissions();
  }

  async checkPermissions() {
    const permission = await Geolocation.checkPermissions();
    if (permission.location !== 'granted') {
      await this.requestPermissions();
    }
  }

  async requestPermissions() {
    const permission = await Geolocation.requestPermissions();
    if (permission.location === 'granted') {
      this.setCurrentPosition();  // Optionally set the current position if needed
    } else {
      console.error('Location permission not granted');
      // Optionally alert the user that location permission is needed
      this.alertController.create({
        header: 'Permission Required',
        message: 'This app needs location permission to function correctly.',
        buttons: ['OK']
      }).then(alert => alert.present());
    }
  }

 // Method to load the map
loadMap() {
  // Set map options
  const mapOptions: google.maps.MapOptions = {
    center: { lat: -34.397, lng: 150.644 }, // Default center coordinates
    zoom: 15, // Default zoom level
  };

  // Get the map element
  const mapElement = document.getElementById('map');
  if (mapElement) {
    // Create a new Google Map and assign it to the map property
    this.map = new google.maps.Map(mapElement, mapOptions);
  } else {
    console.error('Map element not found');
  }
}

// Method to set the current position on the map
async setCurrentPosition() {
  try {
    // Get the current position using the Geolocation API
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    console.log("Current Position: ", position);
    // Create a LatLng object from the current position coordinates
    const currentPos = new google.maps.LatLng(
      position.coords.latitude,
      position.coords.longitude
    );

    if (this.map) {
      // Place a marker on the current position
      this.userMarker = new google.maps.Marker({
        position: currentPos,
        map: this.map,
        title: 'Your Location',
      });

      // Center the map on the user's current position
      this.map.setCenter(currentPos);
    }
  } catch (err) {
    console.error('Could not get current position', err);
  }
}

// Method to start tracking the run
async startTracking() {
  try {
    // Get the current position using the Geolocation API
    const position = await Geolocation.getCurrentPosition();
    console.log("Start tracking position: ", position);
    // Create a LatLng object for the start location
    const startLocation = new google.maps.LatLng(
      position.coords.latitude,
      position.coords.longitude
    );

    // Generate waypoints for a rough circular route
    const waypoints = this.generateCircularPathWaypoints(startLocation, this.selectedRunDistance / 4);

    // Use Google Maps Directions API to get the route
    const directions = await this.getDirections(startLocation, waypoints);

    if (this.map && directions !== null && directions.routes && directions.routes.length > 0) {
      // Draw the route on the map using polylines
      const routePolyline = new google.maps.Polyline({
        path: directions.routes[0].overview_path,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });

      routePolyline.setMap(this.map);

      // Place markers for start and end points
      new google.maps.Marker({
        position: startLocation,
        map: this.map,
        title: 'Start',
      });

      // Center the map on the route
      const bounds = new google.maps.LatLngBounds();
      routePolyline.getPath().forEach((latLng: any) => {
        bounds.extend(latLng);
      });
      this.map.fitBounds(bounds);
    } else {
      console.error('Map or directions data is not available.');
    }
  } catch (err) {
    console.error('Could not start tracking', err);
  }

  await this.setStartLocation();
}

// Method to start the run
async beginRun() {
  await this.setStartLocation(); // Set the start location
  this.startLiveTracking(); // Start live tracking of the user
  this.startTime = new Date(); // Get start time for today
  this.startTimer(); // Start the timer
}




async setStartLocation() {
  const position = await Geolocation.getCurrentPosition();
  // Create a LatLng object for the start location
  this.startLocation = new google.maps.LatLng(
    position.coords.latitude,
    position.coords.longitude
  );
  // Ensure previousPosition is set for distance calculations
  this.previousPosition = this.startLocation;
}


// Method to generate waypoints to create a rough circular route
generateCircularPathWaypoints(center: google.maps.LatLng, distanceKm: number): google.maps.DirectionsWaypoint[] {
  const waypoints: google.maps.DirectionsWaypoint[] = [];
  const distRadians = distanceKm / 6371; // Earth radius in kilometers
  const centerLatRadians = center.lat() * (Math.PI / 180);
  const centerLngRadians = center.lng() * (Math.PI / 180);

  // Calculate the number of waypoints based on the desired distance
  const numWaypoints = Math.ceil(2 * Math.PI * 6371 * distRadians); // Circumference of Earth * fraction of the Earth's circumference

  // Create waypoints evenly spaced around the circle
  for (let i = 0; i < numWaypoints; i++) {
    const angle = (i / numWaypoints) * (2 * Math.PI); // Calculate angle based on the number of waypoints
    const latitudeRadians = Math.asin(Math.sin(centerLatRadians) * Math.cos(distRadians) +
                                      Math.cos(centerLatRadians) * Math.sin(distRadians) * Math.cos(angle));
    const longitudeRadians = centerLngRadians + Math.atan2(Math.sin(angle) * Math.sin(distRadians) * Math.cos(centerLatRadians),
                                                          Math.cos(distRadians) - Math.sin(centerLatRadians) * Math.sin(latitudeRadians));

    waypoints.push({
      location: new google.maps.LatLng(latitudeRadians * (180 / Math.PI), longitudeRadians * (180 / Math.PI)),
      stopover: true,
    });
  }

  return waypoints;
}


// Adjust the getDirections method to handle waypoints
async getDirections(start: google.maps.LatLng, waypoints: google.maps.DirectionsWaypoint[]): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: start,
        waypoints: waypoints,
        destination: start, // The route should end at the start location
        travelMode: google.maps.TravelMode.WALKING,
        optimizeWaypoints: true, // This option will reorder waypoints to minimize route distance
      },
      (result: any, status: any) => {
        if (status === google.maps.DirectionsStatus.OK) {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed due to ${status}`));
        }
      }
    );
  });
}
  // Helper method to calculate destination based on distance
  calculateDestination(startPos: google.maps.LatLng, distance: number): google.maps.LatLng {

    // Calculate new latitude and longitude based on the desired distance
    const newLat = startPos.lat() + (distance / 111.32); // 1 degree of latitude is approximately 111.32 km
    const newLng =
      startPos.lng() + distance / (111.32 * Math.cos(startPos.lat() * (Math.PI / 180)));

    return new google.maps.LatLng(newLat, newLng);
  }


   // Method to start live tracking
   startLiveTracking() {
    const options = {
      maximumAge: 0,
      timeout: 10000,
      enableHighAccuracy: true,
    };
   
    this.watchId = Geolocation.watchPosition(options, (position, err) => {
      if (position) {
        console.log("Live tracking position: ", position);
        this.updateUserMarkerPosition(position);
      } else if (err) {
        console.error('Error watching position:', err);
      }
    });
  }

 
  updateUserMarkerPosition(position: any) {
    console.log("Updating position");
    const newPos = new google.maps.LatLng(
      position.coords.latitude,
      position.coords.longitude
    );
  
     // If previousPosition exists, calculate the distance from it to newPos
  if (this.previousPosition) {
    const distanceMoved = google.maps.geometry.spherical.computeDistanceBetween(
      this.previousPosition,
      newPos
    );
    // Add the distance moved to the total distance
    this.totalDistance += distanceMoved;
    console.log(`Total Distance: ${this.totalDistance} meters`);
  }
  
    // Update user marker
    if (this.userMarker && this.map) {
      this.userMarker.setPosition(newPos); // This updates the marker position
      this.map.panTo(newPos); // This keeps the marker in the center of the map view
    } else if (this.map) {
      // If the marker hasn't been created yet, create it at the new position
      this.userMarker = new google.maps.Marker({
        position: newPos,
        map: this.map,
        title: 'Your Location'
      });
    }
  
    this.changeDetectorRef.detectChanges();
  }
  



  //method to calculate pace of user 
  calculatePace() {
    if (!this.startTime) {
      return "0.00"; // Set an initial value of "0.00" when startTime is not set
    }
  
    const currentTime = new Date(); //get current time to date 
    const timeDiff = (currentTime.getTime() - this.startTime.getTime()) / 1000; // Time difference in seconds
    const distanceKm = this.totalDistance / 1000; // Distance in kilometers
  
    if (distanceKm === 0) {
      return "0.00"; // Set "0.00" if the distance is 0
    }
  
    const pace = timeDiff / 60 / distanceKm; // Pace in minutes per kilometer
    return pace.toFixed(2); // Convert to number with two decimal places
  }
  

  startTimer() {
    this.timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - (this.startTime?.getTime() || now.getTime());
  
      // Update elapsed time
      this.elapsedTime = this.formatTime(diff);
    }, 1000); // Update every second
  }
  
  // Method to format time in HH:MM:SS format
  formatTime(timeInMillis: number): string {
    let seconds = Math.floor(timeInMillis / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
  
    seconds = seconds % 60;
    minutes = minutes % 60;
  
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }
  // Method to pad single-digit numbers with leading zeros
  pad(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
  }

  
   
  
    // Method to format distance for display
    formatDistance(distance: number): string {
      return (distance / 1000).toFixed(2);  // Convert meters to kilometers and format to 2 decimal places
    }

  // Method to stop live tracking
  stopLiveTracking() {
    if (this.watchId != null) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }

  stopRun() {
    // Stop live tracking
    this.stopLiveTracking();
  
    // Stop timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  
    // Calculate elapsed time in milliseconds
    const endTime = new Date();
    this.diff = this.startTime ? endTime.getTime() - this.startTime.getTime() : 0;

      // Assuming you have distance in meters, convert it to kilometers
    const distanceKm = this.totalDistance / 1000;
    const pace = this.calculatePace(); // Make sure this returns a string
    const time = this.elapsedTime; // Ensure this is a string formatted as desired
  
    // Make sure user is signed in and has an ID
    this.auth.currentUser$.subscribe(user => {
      if (user && user.uid) {
        // Create runData object
        const runData: RunData = {
          userId: user.uid,
          distance: this.totalDistance,
          pace: parseFloat(this.calculatePace()),
          elapsedTime: this.diff,
          timestamp: new Date(),
        };
  
        // Save the run data
        this.userProfileService.saveRunData(runData)
        .then(() => {
          console.log("Run data saved successfully.");
          // Present the alert with the run summary
          this.presentRunSummaryPopover(runData);
        })
        .catch(error => {
          console.error("Error saving run data:", error);
        });
      } else {
        console.error("User is not authenticated or ID is missing");
      }
    });
  }
  


  // Method to add a pulse effect to the map
addPulseEffect(map: any, position: any) {
  const overlay = new google.maps.OverlayView();

  overlay.onAdd = function () {
    const panes = this.getPanes();
    if (!panes) {
      console.error('Map panes are not available yet.');
      return;
    }

    const layer = document.createElement('div');
    layer.className = 'pulse';
    panes.overlayLayer.appendChild(layer);

    overlay.draw = () => {
      const projection = this.getProjection();
      const pixelPosition = projection.fromLatLngToDivPixel(position);

      if (pixelPosition) {
        layer.style.left = `${pixelPosition.x}px`;
        layer.style.top = `${pixelPosition.y}px`;
      }
    };
  };

  overlay.setMap(map);
}
  
  // Method to present run summary in a popover
async presentRunSummaryPopover(runData: RunData) {
  const popover = await this.popoverController.create({
    component: RunSummaryPopoverComponent,
    componentProps: {
      distance: `${(runData.distance / 1000).toFixed(2)}`,
      pace: `${runData.pace.toFixed(2)}`,
      time: this.formatTime(runData.elapsedTime)
    },
    cssClass: 'run-summary-popover'
  });
  await popover.present();
}
  
  
  
}
