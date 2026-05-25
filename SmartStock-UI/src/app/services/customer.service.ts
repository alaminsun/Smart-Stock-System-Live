import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5049/api/Customers';
  //private apiUrl = 'https://localhost:7125/api/Customers';
  //private apiUrl = '/api/Customers';

  
  customers = signal<Customer[]>([]);

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl).pipe(
      tap(res => this.customers.set(res))
    );
  }

  saveCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer).pipe(
      tap(() => this.getCustomers().subscribe())
    );
  }

  updateCustomer(id: string, customer: Customer): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, customer).pipe(
      tap(() => this.getCustomers().subscribe())
    );
  }

  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.getCustomers().subscribe())
    );
  }
}