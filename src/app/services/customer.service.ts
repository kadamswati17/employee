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

    getAllBatches(): Observable<any[]> {
        return this.http.get<any[]>(BATCH_API_URL);
    }

    approveBatch(bactno: number): Observable<any> {
        return this.http.post<any>(`${BATCH_API_URL}/${bactno}/approve`, {});
    }

    downloadBatch(bactno: number) {
        return this.http.get(`${BATCH_API_URL}/${bactno}/download`, {
            responseType: 'blob'
        });
    }
}
