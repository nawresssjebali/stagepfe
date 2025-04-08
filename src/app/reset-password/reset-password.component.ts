import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string | null = null;
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log("ResetPasswordComponent initialized.");
    this.route.paramMap.subscribe(params => {
      this.token = params.get('token');
      console.log("Received token:", this.token);
    });
  }
  
  
  // Function to log error to backend
  logErrorToBackend(logMessage: string): void {
    this.http.post('http://localhost:5000/log-error', { message: logMessage })
      .subscribe(() => console.log("Error logged to backend"));
  }

  onResetPassword(): void {
    // Check if the passwords match
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    // Send the request to reset the password
    this.http.post('http://localhost:5000/reset-password', { token: this.token, password: this.newPassword })
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.successMessage = 'Password has been successfully reset!';
            setTimeout(() => this.router.navigate(['/login']), 5000); // Redirect to login after 5 seconds
          } else {
            this.errorMessage = response.message || 'An error occurred while resetting your password.';
          }
        },
        (error) => {
          console.error('Error resetting password:', error);
          this.errorMessage = 'An error occurred while resetting your password. Please try again.';
        }
      );
  }}