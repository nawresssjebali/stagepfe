import { Routes } from '@angular/router';
import { DashboardMedecinCardiologueComponent } from './dashboard-medecin-cardiologue/dashboard-medecin-cardiologue.component';
import { DashboardMedecinGeneralisteComponent } from './dashboard-medecin-generaliste/dashboard-medecin-generaliste.component';
import { ForgetMeComponent } from './forget-me/forget-me.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },   // Default route (Login)
  { path: 'register', component: RegisterComponent }, 
  { path: 'login', component: LoginComponent }, // Registration page
// Dashboard after login

  { path: 'dashboard-medecin-generaliste', component: DashboardMedecinGeneralisteComponent ,
    canActivate: [AuthGuard]}, // Dashboard for generaliste
  { path: 'dashboard-medecin-cardiologue', component: DashboardMedecinCardiologueComponent },
  { path: 'forget-me', component: ForgetMeComponent }, // Dashboard for cardiologue
  //{ path: '**', redirectTo: '', pathMatch: 'full' },
  { path: 'reset-password/:token', component: ResetPasswordComponent }, // Wildcard route for undefined paths (404)


];
