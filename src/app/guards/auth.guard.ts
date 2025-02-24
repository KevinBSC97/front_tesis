import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LocationStrategy } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private locationStrategy: LocationStrategy){
    this.preventBackButton();
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
      return false;
    }
  }

  preventBackButton() {
    history.pushState(null,"", location.href);
    this.locationStrategy.onPopState(() => {
      if (!this.authService.isLoggedIn()) {
        history.pushState(null, "", location.href);
        this.router.navigate(['/login']);
      }
    });
  }
}
