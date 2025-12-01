import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class UploadService {

    private uploadUrl = 'http://localhost:8080/api/files/upload';

    constructor(private http: HttpClient) { }
    uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post(this.uploadUrl, formData, { responseType: 'text' });
    }

}
