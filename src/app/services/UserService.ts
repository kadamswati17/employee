import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = "http://localhost:8080/api/users";

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private http: HttpClient) { }

    // // ⭐ REQUIRED — fetch logged-in user from localStorage
    // static getUser() {
    //     return JSON.parse(localStorage.getItem('user') || '{}');
    // }

    static saveUser(user: any) {
        localStorage.setItem("user", JSON.stringify(user));
    }

    static getUser() {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }

    static clearUser() {
        localStorage.removeItem("user");
    }


    getAllUsers(): Observable<any[]> {
        return this.http.get<any[]>(API_URL);
    }

    getUser(id: number): Observable<any> {
        return this.http.get<any>(`${API_URL}/${id}`);
    }

    createUser(user: any) {
        return this.http.post(API_URL, user);
    }

    updateUser(id: number, user: any) {
        return this.http.put(`${API_URL}/${id}`, user);
    }

    deleteUser(id: number) {
        return this.http.delete(`${API_URL}/${id}`);
    }

    activateUser(id: number) {
        return this.http.put(`${API_URL}/${id}/activate`, {});
    }

    deactivateUser(id: number) {
        return this.http.put(`${API_URL}/${id}/deactivate`, {});
    }
}
