import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Production } from '../models/production.model';
// import { Production } from './production.model';

@Injectable({
    providedIn: 'root'
})
export class ProductionDashboardService {

    private API = 'http://localhost:8080/api/production';



    constructor(private http: HttpClient) { }

    getDashboard(): Observable<Production[]> {
        return this.http.get<Production[]>(this.API);
    }

}
