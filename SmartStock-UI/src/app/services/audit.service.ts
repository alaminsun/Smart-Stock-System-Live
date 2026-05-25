
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auditlog`


  getAuditLogs(page: number = 1, pageSize: number = 50): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
}

}