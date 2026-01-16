import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class WireCuttingReportService {

    private api = 'http://localhost:8080/api/wire-cutting';

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<any[]>(this.api);
    }

    save(data: any) {
        return this.http.post(this.api, data);
    }

    update(id: number, data: any) {
        return this.http.put(`${this.api}/${id}`, data);
    }

    delete(id: number) {
        return this.http.delete(`${this.api}/${id}`);
    }
}
