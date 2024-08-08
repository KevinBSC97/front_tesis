import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'tesis_advocorp';

  constructor(private router: Router, private authService: AuthService) {
    this.preventBackButton();
  }

  preventBackButton() {
    history.pushState(null, "", location.href);
    window.onpopstate = () => {
      history.go(1);
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    };
  }
}
