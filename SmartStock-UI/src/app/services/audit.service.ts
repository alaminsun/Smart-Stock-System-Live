
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5049/api/auditlog'
  //private apiUrl = 'https://localhost:7125/api/auditlog'
  //private apiUrl = '/api/auditlog';


  getAuditLogs(page: number = 1, pageSize: number = 50): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
}

//   updateCategory(id: number, category: Category): Observable<Category> {
//     return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
//   }

}