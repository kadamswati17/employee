import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest } from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

const AUTH_API = 'http://localhost:8080/api/auth';
const API_URL = 'http://localhost:8080/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginStatus = new BehaviorSubject<boolean>(this.isAuthenticated());
  loginStatus$ = this.loginStatus.asObservable();

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) { }

  // =======================================
  // 🔐 LOGIN
  // =======================================
  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${AUTH_API}/signin`, credentials).pipe(
      tap(response => {
        if (response.token) {

          // Save token
          this.tokenStorage.saveToken(response.token);

          // Save user
          this.tokenStorage.saveUser({
            id: response.id,
            username: response.username,
            email: response.email,
            role: response.role  // role is string from backend
          });
          this.loginStatus.next(true);
        }
      })
    );
  }

  // =======================================
  // 🆕 REGISTER USER (ADMIN ONLY)
  // =======================================
  register(user: { username: string; email: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${AUTH_API}/signup`, user);
  }

  // =======================================
  // 🚪 LOGOUT
  // =======================================
  logout(): void {
    this.tokenStorage.signOut();
    this.loginStatus.next(false);
  }

  // =======================================
  // ⭐ CHECK AUTHENTICATION
  // =======================================
  isAuthenticated(): boolean {
    return this.tokenStorage.isLoggedIn();
  }

  getCurrentUser(): any {
    return this.tokenStorage.getUser();
  }

  // =======================================
  // OTHER APIS (BATCH + CUSTOMER)
  // =======================================
  createBatch(batch: any): Observable<any> {
    return this.http.post(`${API_URL}/batch`, batch);
  }

  createCustomerTransaction(bactno: number, customer: any): Observable<any> {
    return this.http.post(`${API_URL}/customer-trn/${bactno}`, customer);
  }

  getCurrentUserFromAPI(): Observable<any> {
    return this.http.get(`${AUTH_API}/me`);
  }
}
