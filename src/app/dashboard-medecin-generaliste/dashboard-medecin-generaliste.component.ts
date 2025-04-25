import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Component, OnInit, Inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-medecin-generaliste',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard-medecin-generaliste.component.html',
  styleUrls: ['./dashboard-medecin-generaliste.component.css']
})
export class DashboardMedecinGeneralisteComponent implements OnInit {
  user: any;
  isLoadingDoctors: boolean = false;
  generalDoctors: any[] = [];
  selectedFile: File | null = null;
  selectedDoctorId: string | null = null;  // <== Add this if it doesn't exist




  doctorPhotoUrl: string | null = null;

  activeSection: string = 'oath'; // <<< NEW - manage active content dynamically
  
  imagePreview: string | null = null;
  isLoading: boolean = false;
  responseMessage: string | null = null;
 
    isBrowser: boolean;
  
    constructor(
      @Inject(PLATFORM_ID) private platformId: Object,
      private router: Router,
      private http: HttpClient
    ) {
      this.isBrowser = isPlatformBrowser(this.platformId);
    }
  
    ngOnInit(): void {
      this.isBrowser = isPlatformBrowser(this.platformId);
    
      if (this.isBrowser) {
        // ✅ Log token from localStorage
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token);
    
        // ✅ Load user data
        const userData = localStorage.getItem('user');
        if (userData) {
          this.user = JSON.parse(userData);
          console.log('User data retrieved:', this.user);
          this.loadDoctorPhoto();
        } else {
          console.error('No user data found in localStorage');
          this.router.navigate(['/login']);
        }
    
        // ✅ Listen for logout in other tabs
        window.addEventListener('storage', (event) => {
          if (event.key === 'user' && event.newValue === null) {
            console.warn('Detected logout from another browser/tab. Redirecting...');
            this.router.navigate(['/login']);
          }
        });
      }
    }
    

  loadDoctorPhoto(): void {
    if (!this.user?.photo) {
      console.error('Photo data is missing, cannot load photo.');
      return;
    }

    const savedPhotoUrl = localStorage.getItem('doctorPhotoUrl');
    if (savedPhotoUrl) {
      this.doctorPhotoUrl = savedPhotoUrl;
      console.log('Loaded photo URL from localStorage:', this.doctorPhotoUrl);
    } else {
      const photoUrl = `http://localhost:5000${this.user.photo}`;
      this.doctorPhotoUrl = photoUrl;
      localStorage.setItem('doctorPhotoUrl', this.doctorPhotoUrl);
      console.log('Generated and saved photo URL:', this.doctorPhotoUrl);
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.user.photo = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  submitForm(userForm: NgForm) {
    if (userForm.invalid) {
      this.responseMessage = 'Please correct the errors before submitting.';
      return;
    }
  
    this.isLoading = true;
    const formData = new FormData();
  
    if (this.user.name) formData.append('name', this.user.name);
    if (this.user.address) formData.append('address', this.user.address);
    if (this.user.email) formData.append('email', this.user.email);
    if (this.user.mobile) formData.append('mobile', this.user.mobile);
    if (this.user.specialty) formData.append('specialty', this.user.specialty);
    if (this.user.practiceLocation) formData.append('practiceLocation', this.user.practiceLocation);
    if (this.user.password) formData.append('password', this.user.password);
  
    if (this.user.photo instanceof File) {
      formData.append('photo', this.user.photo);
    }
  
    this.http.put(`http://localhost:5000/users/${this.user.id}`, formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.responseMessage = 'User updated successfully';
        if (response?.user) {
          this.user = response.user;
          localStorage.setItem('user', JSON.stringify(this.user));
          console.log('Updated user stored successfully');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.responseMessage = 'An error occurred while updating user information.';
        console.error('Error updating user:', error);
      }
    });
  }
  
  // Sidebar Actions

  onShowProfileSettings() {
    console.log('Switching to profile-settings section');
    this.activeSection = 'profile-settings';
  }

  onDeleteAccount() {
    console.log('Switching to delete account section');
    this.activeSection = 'delete';
  }

  onLogout() {
    console.log('Logging out...');
    // Optional: handle logout functionality
    localStorage.clear();
    console.log('Cleared localStorage');
    this.router.navigate(['/login']); // or wherever your login page is
  }

  confirmDelete() {
    console.log('Confirming account deletion...');
    this.activeSection = 'goodbye'; // After confirming delete
    console.log('Switched to goodbye section');

    // Show goodbye message for a while, then delete the account
    setTimeout(() => {
      this.deleteAccount().then(() => {
        this.logout();
      }).catch((error) => {
        console.error('Error during account deletion:', error);
      });
    }, 3000); // Delay of 3 seconds
  }

  // Method to delete the account
  deleteAccount(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate a backend API call to delete the account
      this.http.delete(`http://localhost:5000/users/${this.user.id}`).subscribe(
        (response: any) => {
          console.log('Account deleted successfully');
          resolve();
        },
        error => {
          console.error('Failed to delete account', error);
          reject(error);
        }
      );
    });
  }

  // Method to log the user out after deletion
  logout() {
    console.log('Logging out...');
    localStorage.clear(); // Clear all session data
    this.selectedDoctorId = null; // Reset selected doctor
    this.router.navigate(['/login']); // Redirect to login page
  }
  

  onCancelDelete() {
    console.log('Canceling account deletion...');
    this.activeSection = 'oath'; // Go back to Oath if cancel deletion
    console.log('Switched back to oath section');
  }



  
  selectedECGFile: File | null = null;
  ecgUploadMessage: string | null = null;
 

  // Fetch the list of doctors
  fetchGeneralDoctors() {
    this.isLoadingDoctors = true;
    this.http.get<any[]>('http://localhost:5000/api/cardiology-doctors')
      .subscribe({
        next: (doctors) => {
          this.generalDoctors = doctors; // Save the list of doctors
          this.isLoadingDoctors = false; // Stop loading
  
          // Log the fetched doctors to the console
          console.log('Fetched Doctors:', this.generalDoctors);
          console.log('Doctor ID Type:', typeof this.generalDoctors[0]._id);

        },
        error: (error) => {
          console.error('Error fetching doctors:', error);
          this.isLoadingDoctors = false;
        }
      });
  }
  
  // Method to handle section switch for sending to the doctor
  onSendToDoctor() {
    console.log('Send to general doctor');
    this.activeSection = 'send-to-doctor';
    this.fetchGeneralDoctors();
  }
 

  // Method to change the active section to "send-ecg"
 

  // Handle file selection
  // Handle the file selection for ECG
onFileSelect(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.selectedECGFile = file;
    console.log('Selected ECG file:', file);
  }
}


  // Method to handle the file upload
// onSelectDoctor method to capture the doctor's ID




onSelectDoctor(doctor: any) {
  const id = this.getDoctorId(doctor);

  if (!id) {
    console.error("Doctor ID is missing!", doctor);
    return;
  }

  console.log("Selected doctor ID:", id);
  this.selectedDoctorId = id;
}

// Helper function to handle both {_id: "123"} and {_id: {$oid: "123"}}
getDoctorId(doctor: any): string | null {
  if (!doctor || !doctor._id) return null;
  return typeof doctor._id === 'string' ? doctor._id : doctor._id.$oid || null;
}



onECGFileSelected(event: any): void {
  console.log('Selected Doctor ID:', this.selectedDoctorId); 
  const file = event.target.files[0];
  if (file) {
    this.selectedECGFile = file;
    console.log('Selected ECG file:', file);
  }
}
emergencyLevel: string | null = null;

// uploadECGFile method to handle the upload
uploadECGFile(): void {
  console.log('Emergency Level:', this.emergencyLevel);
  console.log('Selected Doctor ID:', this.selectedDoctorId);

  // ✅ Check if an emergency level is selected
  if (!this.emergencyLevel) {
    this.ecgUploadMessage = 'Please select an emergency level before uploading!';
    return;
  }

  // ✅ Check if a file is selected
  if (!this.selectedECGFile) {
    this.ecgUploadMessage = 'Please select a file first!';
    return;
  }

  // ✅ Check if a doctor is selected
  if (!this.selectedDoctorId) {
    this.ecgUploadMessage = 'Receiver (Doctor) ID is missing! Please select a doctor.';
    return;
  }

  // ✅ Get sender ID from localStorage
  const user = localStorage.getItem('user');
  const senderId = user ? JSON.parse(user).id : null;
  console.log('📦 Sender ID from user object:', senderId);

  if (!senderId) {
    this.ecgUploadMessage = 'Sender ID is missing!';
    return;
  }

  // ✅ Create form data
  const formData = new FormData();
  formData.append('file', this.selectedECGFile);
  formData.append('emergencyLevel', this.emergencyLevel); // ⬅️ Include emergency level

  // ✅ Show uploading message
  this.ecgUploadMessage = 'Uploading ECG...';

  // ✅ Make HTTP request
  this.http.post('http://localhost:5000/upload-ecg', formData, {
    headers: {
      'senderId': senderId,
      'receiverId': this.selectedDoctorId,
    }
  }).subscribe({
    next: (response: any) => {
      console.log('✅ ECG file uploaded successfully', response);
      this.ecgUploadMessage = 'ECG uploaded successfully!';
      this.selectedECGFile = null;

      // ✅ Reset emergency level after upload
      this.emergencyLevel = ''; // Reset emergency level after uploading the ECG
      console.log('Emergency level reset after upload:', this.emergencyLevel);
    },
    error: (error) => {
      console.error('❌ Error uploading ECG file:', error);
      if (error.status === 400) {
        this.ecgUploadMessage = 'Bad request: Please check the file and IDs.';
      } else if (error.status === 500) {
        this.ecgUploadMessage = 'Server error: Failed to upload ECG.';
      } else {
        this.ecgUploadMessage = 'Unexpected error occurred.';
      }
    }
  });
}

// Method to handle sending the ECG to a selected doctor
onSendECG(event: Event, index: number, doctor: any): void {
  event.stopPropagation(); // Prevent the doctor card click

  this.activeSection = "send-ecg"; // Show ECG upload section

  console.log('📤 Send ECG clicked - Index:', index, 'Doctor ID:', doctor._id);
  this.selectedDoctorId = doctor._id;

  // ✅ Check if a doctor is selected
  if (!doctor._id) {
    this.ecgUploadMessage = 'Receiver (Doctor) ID is missing!';
    return;
  }

  // ✅ Check if a file is selected
  if (!this.selectedECGFile) {
    this.ecgUploadMessage = 'Please select an ECG file first!';
    return;
  }

  // ✅ Check if an emergency level is selected
  if (!this.emergencyLevel) {
    this.ecgUploadMessage = 'Please select an emergency level before sending!';
    return;
  }

  // ✅ Prepare form data
  const formData = new FormData();
  formData.append('file', this.selectedECGFile);
  formData.append('emergencyLevel', this.emergencyLevel); // ⬅️ Include emergency level here too

  this.isLoading = true;

  // ✅ Make HTTP request
  this.http.post(`http://localhost:5000/upload-ecg/${doctor._id}`, formData).subscribe({
    next: () => {
      this.isLoading = false;
      this.ecgUploadMessage = 'ECG file sent successfully!';
      this.selectedECGFile = null;

      // ✅ Clear the emergency level after successful sending
      this.emergencyLevel = ''; // Reset emergency level after sending the ECG
      console.log('Emergency level reset after send:', this.emergencyLevel);
    },
    error: (error) => {
      this.isLoading = false;
      console.error('❌ Error sending ECG:', error);
      this.ecgUploadMessage = 'Failed to send ECG file.';
    }
  });
}
}