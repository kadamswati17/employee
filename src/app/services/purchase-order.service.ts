import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchaseOrder } from '../models/purchase-order.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {

    private API = `${environment.apiUrl}/purchase-orders`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<PurchaseOrder[]> {
        return this.http.get<PurchaseOrder[]>(this.API);
    }

    create(order: PurchaseOrder): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(this.API, order);
    }
}
