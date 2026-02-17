// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { AuthService } from '../../services/auth.service';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css']
// })
// export class LoginComponent implements OnInit {

//   loginForm!: FormGroup;
//   isLoggedIn = false;
//   isLoginFailed = false;
//   errorMessage = '';
//   isLoading = false;

//   constructor(
//     private fb: FormBuilder,
//     private authService: AuthService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     // Already logged in? redirect
//     if (this.authService.isAuthenticated()) {
//       this.router.navigate(['/home']);
//       return;
//     }

//     // Login form using email + password
//     this.loginForm = this.fb.group({
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(6)]]
//     });
//   }

//   onSubmit(): void {
//     if (!this.loginForm.valid) return;

//     this.isLoading = true;
//     this.isLoginFailed = false;

//     const credentials = {
//       email: this.loginForm.value.email,
//       password: this.loginForm.value.password
//     };

//     this.authService.login(credentials).subscribe({
//       next: (res: any) => {
//         // ✅ token & user already saved in AuthService

//         // 🔒 SAME ROLE-BASED LOGIC (UNCHANGED)
//         if (res.role === 'ROLE_ADMIN') {
//           this.router.navigate(['/home']);
//         } else if (
//           res.role === 'ROLE_L1' ||
//           res.role === 'ROLE_L2' ||
//           res.role === 'ROLE_L3'
//         ) {
//           this.router.navigate(['/customers']); // or '/km-list'
//         }

//         this.isLoading = false;
//       },
//       error: (err) => {
//         this.isLoginFailed = true;
//         this.errorMessage = err.error?.message || 'Invalid login credentials';
//         this.isLoading = false;
//       }
//     });
//   }
// }


import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  isLoginFailed = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {

    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.isLoginFailed = false;

    this.authService.login(this.loginForm.value).subscribe({

      next: (res: any) => {

        localStorage.setItem('userId', res.id);
        localStorage.setItem('username', res.username);
        localStorage.setItem('email', res.email);
        localStorage.setItem('role', res.role);   // ⭐⭐⭐ MUST


        // ✅ go to dashboard
        this.router.navigate(['/home']);

        this.isLoading = false;
      },

      error: (err) => {
        this.isLoginFailed = true;
        this.errorMessage =
          err.error?.message || 'Invalid login credentials';
        this.isLoading = false;
      }
    });
  }
}
