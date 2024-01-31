import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';

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

  startLocation: google.maps.LatLng | null = null;
  distanceFromStart: number = 0;  // Distance in meters

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  ngAfterViewInit() {
    // Load the map and set the current position after the view has been initialized
    this.loadMap();
    this.setCurrentPosition();
  }

  // Method to load the map
  loadMap() {
    const mapOptions: google.maps.MapOptions = {
      center: { lat: -34.397, lng: 150.644 },
      zoom: 15,
    };

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
      const position = await Geolocation.getCurrentPosition();
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
      routePolyline.getPath().forEach((latLng) => {
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

beginRun() {
  this.startLiveTracking();
  this.startTime = new Date();
  this.startTimer();
}

// Helper method to generate waypoints for a circular path
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
      (result, status) => {
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
    // For simplicity, this is a basic example; you may need a more complex algorithm
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
      timeout: 5000,
      enableHighAccuracy: true,
    };
  
    this.watchId = Geolocation.watchPosition(options, (position, err) => {
      if (position) {
        this.updateUserMarkerPosition(position);
      } else if (err) {
        console.error('Error watching position:', err);
      }
    });
  }

  // Method to update user marker position
  // Method to update user marker position
updateUserMarkerPosition(position: any) {
  const newPos = new google.maps.LatLng(
    position.coords.latitude,
    position.coords.longitude
  );

  // Update distance from start
  if (this.startLocation) {
    this.distanceFromStart = google.maps.geometry.spherical.computeDistanceBetween(this.startLocation, newPos);
  }

  // Update total distance
  if (this.previousPosition) {
    this.totalDistance += google.maps.geometry.spherical.computeDistanceBetween(this.previousPosition, newPos);
  }
  this.previousPosition = newPos;

  // Update user marker
  if (this.userMarker && this.map) {
    this.userMarker.setPosition(newPos);
    this.map.panTo(newPos);
  }
}
  //method to calculate pace of user 
  calculatePace() {
    if (!this.startTime) {
      return "0.00"; // Set an initial value of "0.00" when startTime is not set
    }
  
    const currentTime = new Date();
    const timeDiff = (currentTime.getTime() - this.startTime.getTime()) / 1000; // Time difference in seconds
    const distanceKm = this.totalDistance / 1000; // Distance in kilometers
  
    if (distanceKm === 0) {
      return "0.00"; // Set "0.00" if the distance is 0
    }
  
    const pace = timeDiff / 60 / distanceKm; // Pace in minutes per kilometer
    return pace.toFixed(2); // Return pace formatted to two decimal places
  }
  

  startTimer() {
    this.timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - (this.startTime?.getTime() || now.getTime());
  
      // Update elapsed time
      this.elapsedTime = this.formatTime(diff);
    }, 1000); // Update every second
  }
  
  formatTime(timeInMillis: number): string {
    let seconds = Math.floor(timeInMillis / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
  
    seconds = seconds % 60;
    minutes = minutes % 60;
  
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }
  
  pad(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
  }

    // Method to set the start location
    async setStartLocation() {
      const position = await Geolocation.getCurrentPosition();
      this.startLocation = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );
    }
  
    // ... existing startTimer, formatTime, pad, and stopRun methods ...
  
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
  }
  
}
