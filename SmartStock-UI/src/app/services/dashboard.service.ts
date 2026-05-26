import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Dashboard`;


  // Fetch all dashboard stats (Tiles, Chart Data, Comparison)
  getDashboardStats(period: string = 'today'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.apiUrl}/stats`, { params });
  }

  // Get recent invoices or top selling products if needed separately
  getRecentInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/recent-invoices`);
  }

  // Filter stats by period (e.g. Today, Monthly, Yearly)
  getFilteredStats(period: string): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.apiUrl}/stats`, { params });
  }
}