import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KmBatch } from '../models/km-batch.model';
import { KmEntry } from '../models/km-entry.model';

const BATCH_API = 'http://localhost:8080/api/km-batch';
const ENTRY_API = 'http://localhost:8080/api/km-entry';

@Injectable({
    providedIn: 'root'
})
export class KmService {
    constructor(private http: HttpClient) { }

    // Batch APIs
    getAllBatches(): Observable<KmBatch[]> {
        return this.http.get<KmBatch[]>(BATCH_API);
    }

    createBatch(batch: any): Observable<KmBatch> {
        return this.http.post<KmBatch>(BATCH_API, batch);
    }




    approveBatch(kmBatchNo: number): Observable<KmBatch> {
        return this.http.post<KmBatch>(`${BATCH_API}/${kmBatchNo}/approve`, {});
    }

    rejectBatch(kmBatchNo: number, reason?: string): Observable<KmBatch> {
        const url = `${BATCH_API}/${kmBatchNo}/reject` + (reason ? `?reason=${encodeURIComponent(reason)}` : '');
        return this.http.post<KmBatch>(url, {});
    }

    deleteBatch(kmBatchNo: number): Observable<void> {
        return this.http.delete<void>(`${BATCH_API}/${kmBatchNo}`);
    }

    downloadBatch(kmBatchNo: number) {
        return this.http.get(`${BATCH_API}/${kmBatchNo}/download`, { responseType: 'blob' });
    }

    // Entry APIs
    createEntryWithBatch(batchNo: number, entry: KmEntry): Observable<KmEntry> {
        return this.http.post<KmEntry>(`${ENTRY_API}/${batchNo}`, entry);
    }

    getEntriesByBatch(batchNo: number): Observable<KmEntry[]> {
        return this.http.get<KmEntry[]>(`${ENTRY_API}/batch/${batchNo}`);
    }

    updateEntry(id: number, payload: KmEntry): Observable<KmEntry> {
        return this.http.put<KmEntry>(`${ENTRY_API}/${id}`, payload);
    }

    deleteEntry(id: number): Observable<void> {
        return this.http.delete<void>(`${ENTRY_API}/${id}`);
    }
}
