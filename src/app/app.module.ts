import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';  // ✅ Import FormsModule for ngModel
import { HttpClientModule } from '@angular/common/http';  // ✅ Import HttpClientModule for HTTP requests

import { AppComponent } from './app.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';  // Assuming login component exists
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,  // Add other components here as needed
  ],
  imports: [
    BrowserModule,
    FormsModule,  // Import FormsModule
    HttpClientModule, // Import HttpClientModule for HTTP requests
    CommonModule  // CommonModule is already part of BrowserModule, so you might not need to import it again
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

