import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CastingHallReportService {

    private apiUrl = 'http://localhost:8080/api/casting-report';

    constructor(private http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    save(data: any): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    update(id: number, data: any) {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    // getProductionList(): Observable<any[]> {
    //     return this.http.get<any[]>(this.productionApi);
    // }
}
