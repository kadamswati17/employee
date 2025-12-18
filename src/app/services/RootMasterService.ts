import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RootMasterService {

    private baseUrl = 'http://localhost:8080/api/roots';

    constructor(private http: HttpClient) { }

    private authHeaders() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${localStorage.getItem('token')}`
            })
        };
    }

    // GET ALL
    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.baseUrl, this.authHeaders());
    }

    // SAVE / UPDATE
    save(payload: any): Observable<any> {
        return this.http.post(this.baseUrl, payload, this.authHeaders());
    }

    // DELETE
    delete(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${id}`, this.authHeaders());
    }
}
