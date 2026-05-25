import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/report`



    getProfitLossStatement(period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profit-loss-statement?period=${period}`);
    }

}