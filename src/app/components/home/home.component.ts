import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentSection: string = 'inicio';

  constructor(private authService: AuthService, private router: Router){

  }

  ngOnInit(): void {

  }

  changeSection(section: string){
    this.currentSection = section;
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
