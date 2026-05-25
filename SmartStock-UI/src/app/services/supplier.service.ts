import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5049/api/Suppliers';
  //private apiUrl = 'https://localhost:7125/api/Suppliers';
  //private apiUrl = '/api/Suppliers';

  
  suppliers = signal<Supplier[]>([]);

  // 1. Get all suppliers
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl).pipe(
      tap(res => this.suppliers.set(res))
    );
  }

  // 2. Save new supplier
  saveSupplier(supplier: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, supplier).pipe(
      tap(() => this.getSuppliers().subscribe())
    );
  }

  // 3. Update supplier information
  updateSupplier(id: string, supplier: Supplier): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, supplier).pipe(
      tap(() => this.getSuppliers().subscribe())
    );
  }

  // 4. Delete supplier
  deleteSupplier(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.getSuppliers().subscribe())
    );
  }
}