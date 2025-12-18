import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PriceMasterService {

    private baseUrl = 'http://localhost:8080/api';

    constructor(private http: HttpClient) { }

    private authHeaders() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${localStorage.getItem('token')}`
            })
        };
    }

    // ================= PARTY LIST =================
    getParties(): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.baseUrl}/users/parties`,
            this.authHeaders()
        );
    }

    // ================= PRODUCT LIST =================
    getProducts(): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.baseUrl}/products`,
            this.authHeaders()
        );
    }

    // ================= SAVE PARTY PRICE =================
    savePartyPrice(payload: any): Observable<any> {
        return this.http.post(
            `${this.baseUrl}/party-prices`,
            payload,
            this.authHeaders()
        );
    }

    // ================= GET ALL PARTY PRICES =================
    getAllPartyPrices(): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.baseUrl}/party-prices`,
            this.authHeaders()
        );
    }

    // ================= DELETE PARTY PRICE =================
    deletePartyPrice(id: number): Observable<any> {
        return this.http.delete(
            `${this.baseUrl}/party-prices/${id}`,
            this.authHeaders()
        );
    }
}
