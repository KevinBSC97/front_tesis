import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';

import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdminComponent } from './components/admin/admin.component';
import { CitasComponent } from './components/citas/citas.component';
import { AbogadosComponent } from './components/abogados/abogados.component';
import { CitasAsignadasComponent } from './components/citas-asignadas/citas-asignadas.component';
import { CrearCasoComponent } from './components/crear-caso/crear-caso.component';
import { CasosRealizadosComponent } from './components/casos-realizados/casos-realizados.component';
import { MessageService } from 'primeng/api';
import { GestionCasosComponent } from './components/gestion-casos/gestion-casos.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    NavbarComponent,
    AdminComponent,
    CitasComponent,
    AbogadosComponent,
    CitasAsignadasComponent,
    CrearCasoComponent,
    CasosRealizadosComponent,
    GestionCasosComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    SidebarModule,
    BrowserAnimationsModule,
    TableModule,
    HttpClientModule,
    DropdownModule,
    DialogModule,
    CalendarModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
