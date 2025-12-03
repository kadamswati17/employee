import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'EmployeeManagementSystem';
  isLoggedIn = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // 🔥 Listen to every login/logout update
    this.authService.loginStatus$.subscribe(isLogged => {
      this.isLoggedIn = isLogged;
    });

    // Set initial value
    this.isLoggedIn = this.authService.isAuthenticated();
  }
}
