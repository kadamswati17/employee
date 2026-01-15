import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ProductionService {

    private API = 'http://localhost:8080/api/production';

    constructor(private http: HttpClient) { }

    save(data: any) {
        return this.http.post(this.API, data);
    }

    update(id: number, data: any) {
        return this.http.put(`${this.API}/${id}`, data);
    }

    getAll() {
        return this.http.get<any[]>(this.API);
    }

    delete(id: number) {
        return this.http.delete(`${this.API}/${id}`);
    }
}
