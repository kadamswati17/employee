import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class KmService {

    private apiUrl = 'http://localhost:8080/api/km';

    constructor(private http: HttpClient) { }

    saveKm(data: any): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    getAllKm() {
        return this.http.get<any[]>(`${this.apiUrl}/all`);
    }


}
