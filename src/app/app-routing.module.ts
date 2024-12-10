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
  // Ruta por defecto
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Rutas públicas
  { path: 'login', component: LoginComponent, pathMatch: 'full'  },

  // Rutas protegidas por AuthGuard
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'citas',
    component: CitasComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'abogados',
    component: AbogadosComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'citas-asignadas',
    component: CitasAsignadasComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'crear-caso',
    component: CrearCasoComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'casos-realizados',
    component: CasosRealizadosComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'gestion-casos',
    component: GestionCasosComponent,
    canActivate: [AuthGuard]
  },

  // Ruta wildcard - redirige cualquier ruta no encontrada al home
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
