import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';

const ADMIN_API = 'http://localhost:8080/api/admin';
const PRODUCT_API = 'http://localhost:8080/api/products';

export interface CartItem {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    isEditing?: boolean;
    tempQty?: number;
    tempPrice?: number;
}

export interface PlaceSellOrderDto {
    id?: number;
    userId: number;
    userName?: string;
    orderDescription?: string;
    date?: string;
    amount?: number;
    cartItems?: CartItem[];
}

@Injectable({ providedIn: 'root' })
export class SellService {

    constructor(
        private http: HttpClient,
        private tokenStorage: TokenStorageService
    ) { }

    headers() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${this.tokenStorage.getToken()}`
            })
        };
    }

    getCustomers() {
        return this.http.get<any[]>(
            `http://localhost:8080/api/users/parties`,
            this.headers()
        );
    }


    getAllProducts() {
        return this.http.get<any[]>(`${PRODUCT_API}`, this.headers());
    }

    placeOrder(dto: PlaceSellOrderDto) {
        return this.http.post(`${ADMIN_API}/sell-order/place`, dto, this.headers());
    }

    getSellOrders(): Observable<PlaceSellOrderDto[]> {
        return this.http.get<PlaceSellOrderDto[]>(`${ADMIN_API}/sell-orders`, this.headers());
    }

    getSellOrderDetails(id: number): Observable<PlaceSellOrderDto> {
        return this.http.get<PlaceSellOrderDto>(
            `${ADMIN_API}/sell-order/details/${id}`,
            this.headers()
        );
    }
}
