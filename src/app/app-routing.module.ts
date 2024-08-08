import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AdminComponent } from './components/admin/admin.component';
import { AuthGuard } from './guards/auth.guard';
import { CitasComponent } from './components/citas/citas.component';
import { AbogadosComponent } from './components/abogados/abogados.component';
import { CitasAsignadasComponent } from './components/citas-asignadas/citas-asignadas.component';
import { CrearCasoComponent } from './components/crear-caso/crear-caso.component';
import { CasosRealizadosComponent } from './components/casos-realizados/casos-realizados.component';
import { GestionCasosComponent } from './components/gestion-casos/gestion-casos.component';

const routes: Routes = [
  //Login
  { path: '', redirectTo: '/login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent},
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard]},

  //Home
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard]},

  //Citas
  { path:'citas', component: CitasComponent, canActivate: [AuthGuard]},

  //Abogado
  { path: 'abogados', component: AbogadosComponent, canActivate: [AuthGuard] },

  { path: 'citas-asignadas', component: CitasAsignadasComponent, canActivate: [AuthGuard]},

  //Casos
  { path: 'crear-caso', component:CrearCasoComponent, canActivate: [AuthGuard]},
  { path: 'casos-realizados', component:CasosRealizadosComponent, canActivate: [AuthGuard]},

  { path: 'gestion-casos', component: GestionCasosComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
