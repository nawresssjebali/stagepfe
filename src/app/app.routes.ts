import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardMedecinGeneralisteComponent } from './dashboard-medecin-generaliste/dashboard-medecin-generaliste.component';
import { DashboardMedecinCardiologueComponent } from './dashboard-medecin-cardiologue/dashboard-medecin-cardiologue.component'; // Import Cardiologue Dashboard

export const routes: Routes = [
  { path: '', component: LoginComponent },   // Default route (Login)
  { path: 'register', component: RegisterComponent },  // Registration page
  { path: 'dashboard-medecin-generaliste', component: DashboardMedecinGeneralisteComponent }, // Dashboard for generaliste
  { path: 'dashboard-medecin-cardiologue', component: DashboardMedecinCardiologueComponent }, // Dashboard for cardiologue
  { path: '**', redirectTo: '', pathMatch: 'full' } // Wildcard route for undefined paths (404)
];
