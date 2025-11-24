import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('Navbar - isLoggedIn:', this.isLoggedIn);
    this.isLoggedIn = this.authService.isAuthenticated();
    console.log('Navbar - isLoggedIn:', this.isLoggedIn);
    if (this.isLoggedIn) {
      this.currentUser = this.authService.getCurrentUser();
    }
  }

  logout(): void {
    this.authService.logout();
    // this.isLoggedIn = false;
    // console.log('Navbar - User logged out', this.isLoggedIn);
    this.currentUser = null;
    this.router.navigate(['/login']);
    if (this.router.url === '/login') {
      this.isLoggedIn = false;
    }
    console.log('Navbar - User logged out', this.isLoggedIn);

  }
}

