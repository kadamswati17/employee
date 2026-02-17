// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { BehaviorSubject, Observable, tap } from 'rxjs';
// import { LoginRequest } from '../models/auth.model';
// import { TokenStorageService } from './token-storage.service';
// import { UserService } from './UserService';
// // import { APP_CONFIG } from '../config/config';
// import { APP_CONFIG } from '../config/config';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {

//   // ================= BASE URLs =================
//   private AUTH_API = `${APP_CONFIG.BASE_URL}${APP_CONFIG.API.AUTH}`;
//   private API_BASE = `${APP_CONFIG.BASE_URL}`;

//   // private loginStatus = new BehaviorSubject<boolean>(this.isAuthenticated());
//   private loginStatus = new BehaviorSubject<boolean>(false);

//   loginStatus$ = this.loginStatus.asObservable();

//   // constructor(
//   //   private http: HttpClient,
//   //   private tokenStorage: TokenStorageService,
//   //   private userService: UserService
//   // ) { }
//   constructor(
//     private http: HttpClient,
//     private tokenStorage: TokenStorageService,
//     private userService: UserService
//   ) {
//     this.restoreLoginState();
//   }


//   // =======================================
//   // 🔐 LOGIN
//   // =======================================
//   login(credentials: LoginRequest): Observable<any> {
//     return this.http.post<any>(`${this.AUTH_API}/signin`, credentials).pipe(
//       tap(response => {
//         if (response.token) {

//           // Save token
//           this.tokenStorage.saveToken(response.token);

//           // Save user (session)
//           this.tokenStorage.saveUser({
//             id: response.id,
//             username: response.username,
//             email: response.email,
//             role: response.role
//           });

//           // 🔴 ADD THESE LINES
//           localStorage.setItem('token', response.token);
//           localStorage.setItem('role', response.role);
//           localStorage.setItem('username', response.username);
//           localStorage.setItem('userId', response.id);

//           this.loginStatus.next(true);
//         }
//       })
//     );
//   }

//   private restoreLoginState() {
//     if (this.tokenStorage.isLoggedIn()) {
//       this.loginStatus.next(true);
//     }
//   }

//   // =======================================
//   // 🆕 REGISTER USER (ADMIN ONLY)
//   // =======================================
//   register(user: { username: string; email: string; password: string; role: string }): Observable<any> {
//     return this.http.post(`${this.AUTH_API}/signup`, user);
//   }

//   // =======================================
//   // 🚪 LOGOUT
//   // =======================================
//   logout(): void {
//     this.tokenStorage.signOut();
//     this.loginStatus.next(false);
//   }

//   // =======================================
//   // ⭐ CHECK AUTHENTICATION
//   // =======================================
//   isAuthenticated(): boolean {
//     return this.tokenStorage.isLoggedIn();
//   }

//   getCurrentUser(): any {
//     return this.tokenStorage.getUser();
//   }

//   // =======================================
//   // OTHER APIS (BATCH + CUSTOMER)
//   // =======================================
//   createBatch(batch: any): Observable<any> {
//     return this.http.post(
//       `${this.API_BASE}${APP_CONFIG.API.BATCH}`,
//       batch
//     );
//   }

//   createCustomerTransaction(bactno: number, customer: any): Observable<any> {
//     return this.http.post(
//       `${this.API_BASE}${APP_CONFIG.API.CUSTOMER_TRN}/${bactno}`,
//       customer
//     );
//   }

//   getCurrentUserFromAPI(): Observable<any> {
//     return this.http.get(`${this.AUTH_API}/me`);
//   }

//   // =======================================
//   // ⭐ PROFILE APIs
//   // =======================================
//   getUserInfo(id: number): Observable<any> {
//     return this.http.get(
//       `${this.API_BASE}${APP_CONFIG.API.USERS}/${id}/info`
//     );
//   }

//   updateUserProfile(id: number, data: any): Observable<any> {
//     return this.http.put(
//       `${this.API_BASE}${APP_CONFIG.API.USERS}/${id}/profile`,
//       data
//     );
//   }

//   // =======================================
//   // 👥 USERS (ADMIN)
//   // =======================================
//   getAllUsers(): Observable<any[]> {
//     const headers = new HttpHeaders({
//       Authorization: `Bearer ${this.tokenStorage.getToken()}`
//     });

//     return this.http.get<any[]>(
//       `${this.API_BASE}${APP_CONFIG.API.USERS}/all`,
//       { headers }
//     );
//   }

//   // =======================================
//   // 🏭 SUPPLIERS
//   // =======================================
//   getSuppliers(): Observable<any[]> {
//     return this.http.get<any[]>(
//       `${this.API_BASE}${APP_CONFIG.API.USERS}/parties`,
//       {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`
//         }
//       }
//     );
//   }

//   getLoggedInUserId(): number | null {
//     const user = this.tokenStorage.getUser();
//     return user?.id || null;
//   }


// }


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest } from '../models/auth.model';
import { APP_CONFIG } from '../config/config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private AUTH_API = `${APP_CONFIG.BASE_URL}${APP_CONFIG.API.AUTH}`;
  private API_BASE = `${APP_CONFIG.BASE_URL}`;

  private loginStatus = new BehaviorSubject<boolean>(this.hasUser());
  loginStatus$ = this.loginStatus.asObservable();

  constructor(private http: HttpClient) { }

  // ✅ LOGIN (NO TOKEN)
  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.AUTH_API}/signin`, credentials).pipe(
      tap(response => {

        // ✅ store user in localStorage
        localStorage.setItem('userId', response.id);
        localStorage.setItem('username', response.username);
        localStorage.setItem('email', response.email);
        localStorage.setItem('role', response.role);
        this.loginStatus.next(true);
      })
    );
  }

  // ✅ REGISTER
  register(user: { username: string; email: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${this.AUTH_API}/signup`, user);
  }

  // ✅ LOGOUT
  logout(): void {
    localStorage.clear();
    this.loginStatus.next(false);
  }

  // ✅ CHECK LOGIN
  isAuthenticated(): boolean {
    return this.hasUser();
  }

  private hasUser(): boolean {
    return !!localStorage.getItem('userId');
  }

  // ✅ GET CURRENT USER (LOCAL)
  getCurrentUser() {
    return {
      id: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      email: localStorage.getItem('email')
    };
  }

  // ================= OTHER APIs (NO TOKEN HEADERS) =================

  createBatch(batch: any): Observable<any> {
    return this.http.post(
      `${this.API_BASE}${APP_CONFIG.API.BATCH}`,
      batch
    );
  }

  createCustomerTransaction(bactno: number, customer: any): Observable<any> {
    return this.http.post(
      `${this.API_BASE}${APP_CONFIG.API.CUSTOMER_TRN}/${bactno}`,
      customer
    );
  }

  getCurrentUserFromAPI(): Observable<any> {
    return this.http.get(`${this.AUTH_API}/me`);
  }

  getUserInfo(id: number): Observable<any> {
    return this.http.get(
      `${this.API_BASE}${APP_CONFIG.API.USERS}/${id}/info`
    );
  }

  updateUserProfile(id: number, data: any): Observable<any> {
    return this.http.put(
      `${this.API_BASE}${APP_CONFIG.API.USERS}/${id}/profile`,
      data
    );
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}${APP_CONFIG.API.USERS}/all`
    );
  }

  getSuppliers(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}${APP_CONFIG.API.USERS}/parties`
    );
  }

  getLoggedInUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? +id : null;
  }

  private restoreLoginState() {
    this.loginStatus.next(this.hasUser());
  }
}
