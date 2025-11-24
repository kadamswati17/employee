import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse } from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

const AUTH_API = 'http://localhost:8080/api/auth';
const API_URL = 'http://localhost:8080/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) { }

  // =======================================
  // 🔐 AUTHENTICATION
  // =======================================

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${AUTH_API}/signin`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.tokenStorage.saveToken(response.token);
          this.tokenStorage.saveUser({
            username: response.username,
            email: response.email,
            roles: response.roles
          });
        }
      })
    );
  }

  register(user: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${AUTH_API}/signup`, user);
  }

  logout(): void {
    this.tokenStorage.signOut();
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.isLoggedIn();
  }

  getCurrentUser(): any {
    return this.tokenStorage.getUser();
  }


  // =======================================
  // 📌 NEW API CALLS FOR BATCH + CUSTOMER
  // =======================================

  // Save Batch (tbl1)
  createBatch(batch: any): Observable<any> {
    return this.http.post(`${API_URL}/batch`, batch);
  }

  // Save Customer Transaction (tbl2)
  createCustomerTransaction(bactno: number, customer: any): Observable<any> {
    return this.http.post(`${API_URL}/customer-trn/${bactno}`, customer);
  }

  getCurrentUserFromAPI(): Observable<any> {
    return this.http.get(`${AUTH_API}/me`);
  }

}
