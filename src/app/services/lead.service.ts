import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lead } from '../models/lead.model';

@Injectable({
    providedIn: 'root'
})
export class LeadService {

    private API = 'http://localhost:8080/api/leads';

    constructor(private http: HttpClient) { }

    create(lead: Lead): Observable<Lead> {
        return this.http.post<Lead>(this.API, lead);
    }

    getAll(): Observable<Lead[]> {
        return this.http.get<Lead[]>(this.API);
    }

    getById(id: number): Observable<Lead> {
        return this.http.get<Lead>(`${this.API}/${id}`);
    }

    update(id: number, lead: Lead): Observable<Lead> {
        return this.http.put<Lead>(`${this.API}/${id}`, lead);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API}/${id}`);
    }
}
