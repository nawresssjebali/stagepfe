import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Component, OnInit, Inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import interactionPlugin from '@fullcalendar/interaction';
import {ViewEncapsulation } from '@angular/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { FullCalendarModule } from '@fullcalendar/angular'; 
import { DateSelectArg } from '@fullcalendar/core';


import { Subject } from 'rxjs';

import {
  CalendarEvent,
  CalendarView,
  CalendarWeekViewComponent,
} from 'angular-calendar';
import { CalendarOptions } from '@fullcalendar/core/index.js';



@Component({
  selector: 'app-dashboard-medecin-generaliste',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HttpClientModule, 
    MatSnackBarModule, 
    
    FullCalendarModule

  ],
  templateUrl: './dashboard-medecin-generaliste.component.html',
  styleUrls: ['./dashboard-medecin-generaliste.component.css'],
  encapsulation: ViewEncapsulation.None ,// Corrected: Added a comma here
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardMedecinGeneralisteComponent implements OnInit {
  user: any;
  isLoadingDoctors: boolean = false;
  generalDoctors: any[] = [];
  selectedFile: File | null = null;
  selectedDoctorId: string | null = null;  // <== Add this if it doesn't exist


  doctors: any[] = []; 
  stars: number[] = [1, 2, 3, 4, 5]; // Define an array of stars for rating

  doctorPhotoUrl: string | null = null;

  activeSection: string = 'oath'; // <<< NEW - manage active content dynamically
  
  imagePreview: string | null = null;
  isLoading: boolean = false;
  responseMessage: string | null = null;
  activeDoctor: string = ''; // Active doctor name
  conversations: { [doctorName: string]: any[] } = {};
  isBrowser: boolean;

  calendarPlugins = [dayGridPlugin]; 


  calendarEvents: { title: string; start: string; end: string; allDay: boolean }[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin], // ✅ include interactionPlugin
    initialView: 'dayGridMonth',
    selectable: true, // ✅ allow date selection
    select: (selectInfo: DateSelectArg) => {
      if (this.selectedDoctorId) {
        this.handleDateSelect(selectInfo, this.selectedDoctorId);
      } else {
        this.snackBar.open('Please select a doctor before choosing a date.', 'Close', {
          duration: 3000,
        });
      }
    
    
    
    
    }, // ✅ Use select handler with the required arguments
    events: this.calendarEvents,
  };
  
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar // <-- Inject MatSnackBar
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  
    if (this.isBrowser) {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
        this.loadDoctorPhoto();
  
        const storedEvents = localStorage.getItem('calendarEvents');
        if (storedEvents) {
          this.calendarEvents = JSON.parse(storedEvents);
          this.calendarOptions.events = this.calendarEvents;
  
          // 🔔 Check if there's an event today
          this.checkTodayEvents(this.calendarEvents);
        } else {
          // Fetch from backend
          this.http.get(`http://localhost:5000/events?userId=${this.user.id}`).subscribe({
            next: (response: any) => {
              this.calendarEvents = response.events;
              this.calendarOptions.events = this.calendarEvents;
              localStorage.setItem('calendarEvents', JSON.stringify(this.calendarEvents));
  
              // 🔔 Check if there's an event today
              this.checkTodayEvents(this.calendarEvents);
            },
            error: (error) => {
              console.error('Error fetching events:', error);
            }
          });
        }
      }
      
  
      // Listen for logout in other tabs
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
messages: { sender: string, text: string }[] = [];
newMessage: string = '';

onchat(event: any, index: number, doctor: any) {
  event.preventDefault(); // Prevent any default behavior for the click event
  this.activeSection="chat";
  // Set the active doctor
  this.activeDoctor = doctor.name;

  
  // If there's no conversation for this doctor, initialize it
  if (!this.conversations[this.activeDoctor]) {
    this.conversations[this.activeDoctor] = []; // Initialize conversation array
  }

  // Optionally, log or alert the selected doctor for debugging
  console.log('Active doctor set to:', this.activeDoctor);
}

// Send a new message in the current active doctor's conversation
sendMessage() {
  if (this.newMessage.trim()) {
    const newMessage = { sender: this.user.name, text: this.newMessage }; // Assuming user sends the message
    this.conversations[this.activeDoctor].push(newMessage); // Add the message to the active doctor's conversation
    this.newMessage = ''; // Clear the message input field
  }
}

rateDoctor(rating: number): void {
  const doctor = this.getSelectedDoctor();
  if (!doctor) {
    console.error('No doctor selected for rating');
    return;
  }

  console.log('Rating doctor:', doctor.name, 'New rating:', rating);
  doctor.rating = rating;
  this.selectedRating = rating;

  this.http.put(`http://localhost:5000/api/doctors/${doctor._id}/rate`, { rating }) // <-- FIXED here
    .subscribe({
      next: () => {
        console.log(`Rated doctor ${doctor.name} with ${rating} stars`);
      },
      error: (err) => {
        console.error('Error updating rating:', err);
      }
    });
}

selectedRating: number = 0;

onrate($event: any, i: number, doctor: any): void {
  this.activeSection = "rate";
  this.activeDoctor = doctor;
  this.selectedDoctorId = this.getDoctorId(doctor); // ✅ This is the missing link
  this.selectedRating = doctor.rating || 0; // Optional: initialize selectedRating from backend
  console.log('Active Section:', this.activeSection);
  console.log($event, i, doctor);
}
// Add these class properties

hoveredRating: number | null = null;

// Method to handle hovering over a star
hoverRating(rating: number): void {
  this.hoveredRating = rating;
}

// Method to reset hover effect when mouse leaves
resetHoveredRating(): void {
  this.hoveredRating = null;
}


backToList(): void {

  this.activeSection = 'send-to-doctor'; // Go back to doctor list view
}
// Assuming you already have a list of doctors fetched in `generalDoctors`
getSelectedDoctor(): any {
  return this.generalDoctors.find((doctor) => doctor._id === this.selectedDoctorId);
}
onreport($event: any, i: number, doctor: any) {
  console.log('Report button clicked', doctor);
  this.activeSection = 'report-doctor';  // Switch to the report-doctor section
  this.activeDoctor = doctor;  // Store the entire doctor object
  this.selectedDoctorId = doctor._id;  // Get the doctor ID from the doctor object
}


reason: string = '';


onSubmit(): void {
  if (!this.activeDoctor || !this.reason) {
    console.error('Doctor or reason is missing!');
    return;
  }

  // Retrieve the username from localStorage
  const user = localStorage.getItem('user');
  if (!user) {
    console.error('No user found in localStorage');
    return;
  }

  // Prepare the report object to send to the backend
  const report = {
    username: user,               // Username from localStorage
    reportedDoctor: this.activeDoctor,  // The doctor being reported
    reason: this.reason,          // The reason for reporting
  };

  console.log('Reporting doctor:', this.activeDoctor, 'Reason:', this.reason);

  // Send the report to the backend
  this.http.post(`http://localhost:5000/api/doctors/${this.selectedDoctorId}/report`, report)
    .subscribe({
      next: () => {
        console.log(`Reported doctor ${this.activeDoctor} for reason: ${this.reason}`);
        this.reason = ''; // Reset the reason after submission
        // Optionally reset active section or navigate away

        // Display a confirmation message with MatSnackBar
        this.snackBar.open('Your report has been submitted. The admin will examine it and get back to you.', 'Close', {
          duration: 5000, // Duration for the message (in ms)
        });
      },
      error: (err) => {
        console.error('Error reporting doctor:', err);
      }
    });
}

view: CalendarView = CalendarView.Week;
CalendarView = CalendarView;

events: CalendarEvent[] = [];
viewDate: Date = new Date();
refresh = new Subject<void>();


loadAvailability() {
  if (!this.selectedDoctorId) return;

  this.http.get<any[]>(`http://localhost:5000/api/doctors/${this.selectedDoctorId}/availability`)
    .subscribe((availability) => {
      this.events = availability.flatMap(day =>
        day.slots.map((slot: string) => {
          const startDate = new Date(`${day.day}T${slot}`);
          const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 minutes later

          return {
            start: startDate,
            end: endDate,
            title: 'Available Video Slot',
            color: { primary: '#4caf50', secondary: '#c8e6c9' },
            meta: { doctorId: this.selectedDoctorId, slot }
          };
        })
      );

      this.refresh.next(); // Notify the calendar to update
    });
}

onSlotClick(event: { date: Date; sourceEvent: MouseEvent }) {
  const { date, sourceEvent } = event;
  console.log(date);
}
onbook(event: any, i: number, doctor: any): void {
  this.activeSection = 'calendar-wrapper'; // ← this is fine IF the *ngIf uses same string
  console.log('Booking clicked:', { event, i, doctor });
}




  // Initialize as an empty array of CalendarEvent
 

  handleDateSelect(selectInfo: DateSelectArg, doctorId: string): void {
    // Prompt the user for the event title
    const title = prompt('Enter event title:');
    
    if (title) {
      // Create the event data to send to the backend
      const eventData = {
        userId: this.user.id,  // User's ID from localStorage
        date: selectInfo.startStr,  // The selected start date
        doctorId: doctorId,  // The selected doctor's ID
        title: title,  // The event title entered by the user
      };
  
      // Send the event data to the backend via HTTP POST
      this.http.post('http://localhost:5000/events', eventData).subscribe({
        next: (response: any) => {
          // Log success
          console.log('Event saved successfully:', response);
  
          // Add the new event to the calendar (local state)
          const newEvent = {
            title: title,
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            allDay: selectInfo.allDay,
          };
          
          this.calendarEvents.push(newEvent);
  
          // Update localStorage with the new events array
          localStorage.setItem('calendarEvents', JSON.stringify(this.calendarEvents));
  
          // Optionally, update the calendar view if required
          // this.calendarOptions.events = [...this.calendarEvents];
        },
        error: (error) => {
          // Log error if POST fails
          console.error('Error saving event:', error);
        }
      });
    }
  }
  checkTodayEvents(events: any[]) {
    const today = new Date().toLocaleDateString('en-CA');
    console.log('📅 Today\'s date:', today);
  
    const todaysEvents = events.filter(event => {
      if (!event.date) {
        console.warn('⚠️ Event is missing a date:', event);
        return false;
      }
  
      try {
        const eventDate = new Date(event.date).toLocaleDateString('en-CA');
        console.log(`🔍 Checking event "${event.title}" with date: ${eventDate}`);
        return eventDate === today;
      } catch (err) {
        console.error('❌ Error parsing date for event:', event, err);
        return false;
      }
    });
  
    console.log('✅ Events matching today\'s date:', todaysEvents);
  
    if (todaysEvents.length > 0) {
      this.snackBar.open(`📅 You have ${todaysEvents.length} event(s) today!`, 'OK', {
        duration: 10000, // 10 seconds
        verticalPosition: 'top',
        panelClass: ['custom-snackbar'], // Add custom styling class
      });
    } else {
      console.log('📭 No events for today.');
    }
  }
}