import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {

    private API_URL = 'http://localhost:8080/api/projects';

    constructor(private http: HttpClient) { }

    // CREATE PROJECT
    create(project: any): Observable<any> {
        return this.http.post(this.API_URL, project);
    }

    // GET ALL PROJECTS
    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.API_URL);
    }

    // GET PROJECT BY ID
    getById(id: number): Observable<any> {
        return this.http.get(`${this.API_URL}/${id}`);
    }

    // UPDATE PROJECT
    update(id: number, project: any): Observable<any> {
        return this.http.put(`${this.API_URL}/${id}`, project);
    }

    // DELETE PROJECT
    delete(id: number): Observable<any> {
        return this.http.delete(`${this.API_URL}/${id}`);
    }
}
