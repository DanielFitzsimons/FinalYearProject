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

      // Specify the end location based on the selected distance
      const endLocation = this.calculateDestination(startLocation, this.selectedRunDistance);

      // Use Google Maps Directions API to get the route
      const directions = await this.getDirections(startLocation, endLocation);

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

        new google.maps.Marker({
          position: endLocation,
          map: this.map,
          title: 'Finish',
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

  // Helper method to get directions from Google Maps Directions API
  async getDirections(start: google.maps.LatLng, end: google.maps.LatLng): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const directionsService = new google.maps.DirectionsService();

      directionsService.route(
        {
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  }
}
