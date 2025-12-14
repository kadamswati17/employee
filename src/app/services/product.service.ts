import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

const API_URL = 'http://localhost:8080/api/products';

@Injectable({ providedIn: 'root' })
export class ProductService {

    constructor(private http: HttpClient) { }

    private authHeaders() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${localStorage.getItem('token')}`
            })
        };
    }

    // CREATE
    create(product: Product, userId: number) {
        return this.http.post<Product>(
            `${API_URL}/${userId}`,
            product,
            this.authHeaders()
        );
    }

    // READ ALL
    getAll(): Observable<Product[]> {
        return this.http.get<Product[]>(API_URL, this.authHeaders());
    }

    // READ BY ID
    getById(id: number): Observable<Product> {
        return this.http.get<Product>(
            `${API_URL}/${id}`,
            this.authHeaders()
        );
    }

    // UPDATE
    update(id: number, product: Product) {
        return this.http.put<Product>(
            `${API_URL}/${id}`,
            product,
            this.authHeaders()
        );
    }

    // DELETE
    delete(id: number) {
        return this.http.delete<any>(
            `${API_URL}/${id}`,
            {
                headers: new HttpHeaders({
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                })
            }
        );
    }

    // add(product: Product, userId: number) {
    //     return this.http.post<Product>(`${API_URL}/${userId}`, product);
    // }

    // create(product: Product, userId: number) {
    //     return this.http.post<Product>(
    //         `${API_URL}/${userId}`,
    //         product,
    //         this.authHeaders()
    //     );
    // }

    createForLoggedInUser(product: Product): Observable<Product> {
        return this.http.post<Product>(
            `${API_URL}/addProduct`,
            product,
            this.authHeaders()
        );
    }

}
