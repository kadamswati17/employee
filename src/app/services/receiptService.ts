import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Receipt } from '../models/receipt.model';

@Injectable({ providedIn: 'root' })
export class ReceiptService {

    private baseUrl = 'http://localhost:8080/api/receipts';

    constructor(private http: HttpClient) { }

    // ⭐ Automatically attach token to every request
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: new HttpHeaders({
                Authorization: token ? `Bearer ${token}` : ''
            })
        };
    }

    getAll(): Observable<Receipt[]> {
        return this.http.get<Receipt[]>(this.baseUrl, this.getAuthHeaders());
    }

    getById(id: number): Observable<Receipt> {
        return this.http.get<Receipt>(`${this.baseUrl}/${id}`, this.getAuthHeaders());
    }

    create(formData: FormData) {
        return this.http.post(this.baseUrl, formData, this.getAuthHeaders());
    }

    update(id: number, formData: FormData) {
        return this.http.put(`${this.baseUrl}/${id}`, formData, this.getAuthHeaders());
    }

    delete(id: number) {
        return this.http.delete(`${this.baseUrl}/${id}`, this.getAuthHeaders());
    }

    getLedger(customerId: number | string) {
        return this.http.get<any>(`${this.baseUrl}/ledger/${customerId}`, this.getAuthHeaders());
    }

    downloadLedgerPDF(customerId: number | string) {
        return this.http.get(`${this.baseUrl}/ledger/${customerId}/pdf`, {
            responseType: 'blob',
            headers: this.getAuthHeaders().headers
        });
    }
}
