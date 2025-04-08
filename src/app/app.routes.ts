<<<<<<< HEAD
=======

// app.routes.ts
// Import DashboardComponent

>>>>>>> 8243676 (interface medecin general version 1)
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardMedecinGeneralisteComponent } from './dashboard-medecin-generaliste/dashboard-medecin-generaliste.component';
import { DashboardMedecinCardiologueComponent } from './dashboard-medecin-cardiologue/dashboard-medecin-cardiologue.component'; // Import Cardiologue Dashboard
<<<<<<< HEAD

export const routes: Routes = [
  { path: '', component: LoginComponent },   // Default route (Login)
  { path: 'register', component: RegisterComponent },  // Registration page
  { path: 'dashboard-medecin-generaliste', component: DashboardMedecinGeneralisteComponent }, // Dashboard for generaliste
  { path: 'dashboard-medecin-cardiologue', component: DashboardMedecinCardiologueComponent }, // Dashboard for cardiologue
  { path: '**', redirectTo: '', pathMatch: 'full' } // Wildcard route for undefined paths (404)
=======
import { ForgetMeComponent } from './forget-me/forget-me.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },   // Default route (Login)
  { path: 'register', component: RegisterComponent }, 
  { path: 'login', component: LoginComponent }, // Registration page
// Dashboard after login

  { path: 'dashboard-medecin-generaliste', component: DashboardMedecinGeneralisteComponent }, // Dashboard for generaliste
  { path: 'dashboard-medecin-cardiologue', component: DashboardMedecinCardiologueComponent },
  { path: 'forget-me', component: ForgetMeComponent }, // Dashboard for cardiologue
  //{ path: '**', redirectTo: '', pathMatch: 'full' },
  { path: 'reset-password/:token', component: ResetPasswordComponent }, // Wildcard route for undefined paths (404)

>>>>>>> 8243676 (interface medecin general version 1)
];
