import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-medecin-generaliste',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard-medecin-generaliste.component.html',
  styleUrls: ['./dashboard-medecin-generaliste.component.css']
})
export class DashboardMedecinGeneralisteComponent implements OnInit {
  user: any;
  doctorPhotoUrl: string | null = null;
  showProfileSettings = false;

  constructor(private http: HttpClient) {}

  // Inside your component
  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      console.log('User data retrieved:', this.user);
      this.loadDoctorPhoto();  // Call to load photo after getting user data
    } else {
      console.error('No user data found in localStorage');
    }
  }

  // Function to load the doctor's photo from the backend API (using the correct static path)
  loadDoctorPhoto(): void {
    if (!this.user?.photo) {
      console.error('Photo data is missing, cannot load photo.');
      return;
    }
  
    // Access the photo from the backend (Node.js server)
    const photoUrl = `http://localhost:5000${this.user.photo}`;
    this.doctorPhotoUrl = photoUrl;
  
    console.log('Generated photo URL:', this.doctorPhotoUrl);
  }
  // In your component.ts file


onShowProfileSettings() {
  this.showProfileSettings = true;
  // You can also hide other sections here by setting their flags to false
}

}  