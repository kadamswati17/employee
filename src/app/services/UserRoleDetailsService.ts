import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserRoleDetailsService {

    private baseUrl = 'http://localhost:8080/api';

    constructor(private http: HttpClient) { }

    private authHeaders() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${localStorage.getItem('token')}`
            })
        };
    }

    // ================= USER ROLE DETAILS =================

    save(data: any): Observable<any> {
        return this.http.post(
            `${this.baseUrl}/user-role-details`,
            data,
            this.authHeaders()
        );
    }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.baseUrl}/user-role-details`,
            this.authHeaders()
        );
    }

    delete(id: number): Observable<any> {
        return this.http.delete(
            `${this.baseUrl}/user-role-details/${id}`,
            this.authHeaders()
        );
    }

    // ================= DROPDOWNS =================

    // ✅ ONLY ROLE_PARTY_NAME
    getPartyUsers(): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.baseUrl}/users/parties`,
            this.authHeaders()
        );
    }

    // ✅ ROOT MASTER
    getRoots(): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.baseUrl}/roots`,
            this.authHeaders()
        );
    }
}
