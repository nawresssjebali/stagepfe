import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http'; // Import HttpClient
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forget-me',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './forget-me.component.html',
  styleUrls: ['./forget-me.component.css']
})
export class ForgetMeComponent {
  constructor(private router: Router, private http: HttpClient) {} // Inject HttpClient

  // This method will be called when the 'Cancel' button is clicked
  goToForgetPassword() {
    this.router.navigate(['/login']); // Navigate to the login page
    console.log('Navigated to login Password page');
  }

  // This method can be used to handle the 'Search' button click event
  onSearchEmail() {
    const email = (document.getElementById('email') as HTMLInputElement).value;
  
    if (!email) {
      alert('Please enter an email address.');
      return;
    }
  
    // Send the email to the backend (use the correct backend URL here)
    this.http.post('http://localhost:5000/send-email', { email }) // Ensure correct URL
      .subscribe(
        (data: any) => {
          // Handle the successful response from the backend
          if (data.success) {
            alert('Email sent successfully!');
          } else {
            alert('Failed to send email: ' + data.message);
          }
        },
        (error: HttpErrorResponse) => {
          console.error('HttpErrorResponse:', error);
          alert('An error occurred: ' + error.message);
        }
      );
  }
}  