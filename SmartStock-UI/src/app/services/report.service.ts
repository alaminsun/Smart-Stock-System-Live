
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5049/api/report'
  //private apiUrl = 'https://localhost:7125/api/report'
  //private apiUrl = '/api/report';



    getProfitLossStatement(period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profit-loss-statement?period=${period}`);
    }

}