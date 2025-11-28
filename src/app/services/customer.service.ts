import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerTrn } from '../models/customer.model';

const API_URL = 'http://localhost:8080/api/customer-trn';
const BATCH_API_URL = 'http://localhost:8080/api/batch';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    constructor(private http: HttpClient) { }

    // Customers CRUD
    getAllCustomers(): Observable<CustomerTrn[]> {
        return this.http.get<CustomerTrn[]>(API_URL);
    }

    getCustomerById(id: number): Observable<CustomerTrn> {
        return this.http.get<CustomerTrn>(`${API_URL}/${id}`);
    }

    createCustomer(customer: CustomerTrn): Observable<CustomerTrn> {
        return this.http.post<CustomerTrn>(API_URL, customer);
    }

    updateCustomer(id: number, customer: CustomerTrn): Observable<CustomerTrn> {
        return this.http.put<CustomerTrn>(`${API_URL}/${id}`, customer);
    }

    deleteCustomer(id: number): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`);
    }

    // Batch APIs
    getAllBatches(): Observable<any[]> {
        return this.http.get<any[]>(BATCH_API_URL);
    }

    createBatch(batch: any): Observable<any> {
        return this.http.post<any>(BATCH_API_URL, batch);
    }

    createTransactionWithBatch(bactno: number, customer: CustomerTrn): Observable<CustomerTrn> {
        return this.http.post<CustomerTrn>(`${API_URL}/${bactno}`, customer);
    }

    getCustomersByBatch(bactno: number): Observable<CustomerTrn[]> {
        return this.http.get<CustomerTrn[]>(`${API_URL}/batch/${bactno}`);
    }

    approveCustomer(id: number): Observable<CustomerTrn> {
        return this.http.post<CustomerTrn>(`${API_URL}/${id}/approve`, {});
    }

    // Approve batch (returns updated batch)
    approveBatch(bactno: number): Observable<any> {
        return this.http.post<any>(`${BATCH_API_URL}/${bactno}/approve`, {});
    }

    // Reject batch (optionally pass reason)
    rejectBatch(bactno: number, reason?: string): Observable<any> {
        const url = `${BATCH_API_URL}/${bactno}/reject` + (reason ? `?reason=${encodeURIComponent(reason)}` : '');
        return this.http.post<any>(url, {});
    }

    // Update batch (Admin + L1)
    updateBatch(bactno: number, payload: any): Observable<any> {
        return this.http.put<any>(`${BATCH_API_URL}/${bactno}`, payload);
    }

    // Delete batch (Admin + L1)
    deleteBatch(bactno: number): Observable<void> {
        return this.http.delete<void>(`${BATCH_API_URL}/${bactno}`);
    }

    // Download pdf
    downloadBatch(bactno: number) {
        return this.http.get(`${BATCH_API_URL}/${bactno}/download`, {
            responseType: 'blob'
        });
    }
}
