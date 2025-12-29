import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inquiry } from '../models/inquiry.model';

@Injectable({ providedIn: 'root' })
export class InquiryService {

    private API = 'http://localhost:8080/api/inquiries';

    constructor(private http: HttpClient) { }

    create(data: Inquiry): Observable<Inquiry> {
        return this.http.post<Inquiry>(this.API, data);
    }

    getAll(): Observable<Inquiry[]> {
        return this.http.get<Inquiry[]>(this.API);
    }
}
