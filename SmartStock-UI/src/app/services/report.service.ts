
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  //private apiUrl = 'http://localhost:5049/api/report'
  //private apiUrl = 'https://localhost:7125/api/report'
  private apiUrl = `${environment.apiUrl}/Products`;



    getProfitLossStatement(period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profit-loss-statement?period=${period}`);
    }

}