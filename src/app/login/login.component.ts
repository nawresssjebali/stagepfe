import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // For HTTP requests
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  passwordVisible = false;
  loginData = { email: '', password: '' }; // Store email and password here
  responseMessage: string = ''; // Message to display for errors or success
  isLoading: boolean = false; // For loading state

  private apiUrl = 'http://localhost:5000/login'; // ✅ Use environment variable in production

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    console.log('Login component initialized');
  }

  // Toggle password visibility
  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
    console.log('Password visibility toggled:', this.passwordVisible);
  }

  // Navigate to the Register page
  goToRegister() {
    this.router.navigate(['/register']);
    console.log('Navigated to the Register page');
  }

  // Submit the login form
  submitLoginForm() {
    console.log('Login form submitted');
    console.log('Email:', this.loginData.email);
    console.log('Password:', this.loginData.password);

    // Validate if both fields are filled
    if (this.loginData.email && this.loginData.password) {
      this.isLoading = true;
      this.authenticateDoctor(this.loginData);
    } else {
      this.responseMessage = 'Please fill in both fields';
      console.error(this.responseMessage); // Debugging error if fields are empty
    }
  }

  // Call the backend API to authenticate the doctor
  authenticateDoctor(loginData: any) {
    console.log('Sending request to authenticate doctor with data:', loginData);

    this.http.post(this.apiUrl, loginData).subscribe(
      (response: any) => {
        console.log('Response from server:', response);

        // Check for successful login (based on your backend response structure)
        if (response?.user) {
<<<<<<< HEAD
=======
          localStorage.setItem('user', JSON.stringify(response.user));
          console.log('User data saved to localStorage:', response.user);

          // If login is successful, navigate to the dashboard or home page
          this.router.navigate(['/dashboard-medecin-generaliste']);
          console.log('Login successful, navigating to dashboard');

>>>>>>> 8243676 (interface medecin general version 1)
          const user = response.user;
          const specialty = user.specialty.trim().toLowerCase(); // Trim and make case insensitive

          console.log('Specialty:', specialty); // Log the specialty for debugging

          // Navigate to the appropriate dashboard based on the specialty
          if (specialty === 'generaliste') {
            this.router.navigate(['/dashboard-medecin-generaliste']);
            console.log('Login successful, navigating to generaliste dashboard');
          } else if (specialty === 'cardiologie') {
            this.router.navigate(['/dashboard-medecin-cardiologue']);
            console.log('Login successful, navigating to cardiologue dashboard');
          } else {
            // Handle cases where the specialty is not recognized
            this.responseMessage = 'Specialty not recognized';
            alert(this.responseMessage);
            console.error('Specialty not recognized:', specialty);
          }
<<<<<<< HEAD
=======

>>>>>>> 8243676 (interface medecin general version 1)
        } else {
          // If login failed, display an error message
          this.responseMessage = response?.message || 'Login failed. Please check your credentials.';
          console.error('Login failed:', this.responseMessage);
          // Show an alert for login failure
          alert('Login failed. Incorrect email or password.');
        }
        this.isLoading = false;
      },
      (error) => {
        // Handle any errors that occur during the HTTP request
        this.isLoading = false;

        // Check for the error status and handle accordingly
        if (error.status === 401) {
          // Incorrect credentials, display an alert
          this.responseMessage = 'Incorrect email or password. Please try again.';
          alert(this.responseMessage); // Show an alert when the password is wrong
        } else if (error.status === 404) {
          // User not found
          this.responseMessage = 'User not found. Please register first.';
          alert(this.responseMessage); // Show an alert for user not found
        } else if (error.status === 500) {
          // Server error
          this.responseMessage = 'Internal server error. Please try again later.';
          alert(this.responseMessage); // Show an alert for internal server error
        } else {
          // Unknown error
          this.responseMessage = 'An unexpected error occurred. Please try again.';
          alert(this.responseMessage); // Show an alert for unexpected errors
        }
        console.error('Error during login request:', error);
      }
    );
<<<<<<< HEAD
}}
=======

  }
  goToForgetPassword() {
    this.router.navigate(['/forget-me']);
    console.log('Navigated to Forget Password page');
  }
  
}

>>>>>>> 8243676 (interface medecin general version 1)
