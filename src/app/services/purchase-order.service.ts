import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';

/* ================= BASE URLs ================= */
const ADMIN_API = 'http://localhost:8080/api/admin';
const PRODUCT_API = 'http://localhost:8080/api/products';

/* ================= MODELS ================= */

export interface CartItem {
    id?: number;
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    productImg?: string;
    totalAmount?: number;
}

export interface PlacePurchaseOrderDto {
    id?: number;
    userId: number;
    userName?: string;
    trackingId?: string;
    amount?: number;
    orderDescription?: string;
    address?: string;
    email?: string;
    mobile?: string;
    pincode?: string;
    orderStatus?: string;
    date?: string;
    cartItems?: CartItem[];
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {

    constructor(
        private http: HttpClient,
        private tokenStorage: TokenStorageService
    ) { }

    private headers() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${this.tokenStorage.getToken()}`
            })
        };
    }

    /* ================= PRODUCTS ================= */
    getAllProductsByUserId(userId: number): Observable<any[]> {
        return this.http.get<any[]>(
            `${PRODUCT_API}/user/${userId}`,
            this.headers()
        );
    }

    /* ================= CART ================= */
    saveCartItem(item: CartItem) {
        return this.http.post(
            `${ADMIN_API}/purchase-cart`,
            item,
            this.headers()
        );
    }

    deleteCartItem(id: number) {
        return this.http.delete(
            `${ADMIN_API}/purchase-cart/${id}`,
            this.headers()
        );
    }

    /* ================= ORDER ================= */
    placeOrder(dto: PlacePurchaseOrderDto) {
        return this.http.post(
            `${ADMIN_API}/purchase-order/place`,
            dto,
            this.headers()
        );
    }

    getPurchaseOrders(): Observable<PlacePurchaseOrderDto[]> {
        return this.http.get<PlacePurchaseOrderDto[]>(
            `${ADMIN_API}/purchase-orders`,
            this.headers()
        );
    }

    getPurchaseOrderDetails(id: number): Observable<PlacePurchaseOrderDto> {
        return this.http.get<PlacePurchaseOrderDto>(
            `${ADMIN_API}/purchase-order/details/${id}`,
            this.headers()
        );
    }

    changeOrderStatus(id: number, status: string) {
        return this.http.put(
            `${ADMIN_API}/purchase-order/status/${id}?status=${status}`,
            {},
            this.headers()
        );
    }
}
