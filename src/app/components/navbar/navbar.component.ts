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
  selectedMaster: string = "";
  selectedTransaction: string = "";

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  // ngOnInit(): void {
  //   console.log('Navbar - isLoggedIn:', this.isLoggedIn);
  //   this.isLoggedIn = this.authService.isAuthenticated();
  //   console.log('Navbar - isLoggedIn:', this.isLoggedIn);
  //   if (this.isLoggedIn) {
  //     this.currentUser = this.authService.getCurrentUser();
  //   }
  // }
  ngOnInit(): void {
    this.authService.loginStatus$.subscribe(isLogged => {
      this.isLoggedIn = isLogged;

      this.currentUser = isLogged ? this.authService.getCurrentUser() : null;

      console.log("Navbar updated:", this.currentUser);
    });
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

  // navigate(event: any) {
  //   const page = event.target.value;
  //   if (page) {
  //     this.router.navigate([page]).then(() => {
  //       // reset both selects after navigation
  //       this.selectedMaster = "";
  //       this.selectedTransaction = "";
  //     });
  //   }
  // }

  navigate(event: any) {
    const page = event.target.value;

    if (page) {
      this.router.navigate([page]).then(() => {
        // reset dropdown so title always shows
        event.target.selectedIndex = 0;
      });
    }
  }


  openProfile() {
    this.router.navigate(['/profile']);

  }

}

