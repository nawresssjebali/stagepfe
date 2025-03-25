// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardMedecinGeneralisteComponent } from './dashboard-medecin-generaliste/dashboard-medecin-generaliste.component'; // Import DashboardComponent

export const routes: Routes = [
  { path: '', component: LoginComponent },   // Default route (Login)
  { path: 'register', component: RegisterComponent },  // Registration page
  { path: 'dashboard-medecin-generaliste', component:DashboardMedecinGeneralisteComponent } // Dashboard after login
];
