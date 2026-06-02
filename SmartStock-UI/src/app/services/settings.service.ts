import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GlobalSetting {
  key: string;
  value: string;
  description?: string;
  group?: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  //private apiUrl = 'http://localhost:5049/api/Settings';
  private apiUrl = `${environment.apiUrl}/Settings`;

  // Public settings signal
  public settings = signal<{ [key: string]: string }>({
    'CompanyName': 'SmartStock',
    'CurrencySymbol': '৳'
  });

  constructor() {
    this.loadPublicSettings();
  }

  loadPublicSettings() {
    this.http.get<any>(`${this.apiUrl}/public`).subscribe(res => {
      this.settings.set(res);
    });
  }

  getSettings(): Observable<GlobalSetting[]> {
    return this.http.get<GlobalSetting[]>(this.apiUrl);
  }

  updateSettings(settings: GlobalSetting[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-bulk`, settings).pipe(
      tap(() => this.loadPublicSettings()) // Refresh public settings after update
    );
  }
}