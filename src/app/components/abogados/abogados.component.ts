import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-abogados',
  templateUrl: './abogados.component.html',
  styleUrls: ['./abogados.component.css']
})
export class AbogadosComponent implements OnInit{
  constructor(private authService: AuthService, private router: Router){}

  ngOnInit(){

  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
