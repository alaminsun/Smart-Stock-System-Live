import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ProductService } from './product.service';

export interface InventoryTransaction {
  productId: string;
  quantity: number;
  remarks?: string;
}

  export interface TransactionHistory {
  id: string;
  transactionDate: Date;
  transactionType: 'StockIn' | 'StockOut';
  quantity: number;
  productName: string;
  supplierName: string;
  customerName: string;
  remarks: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private productService = inject(ProductService); // For updating product signal
  private apiUrl = 'http://localhost:5049/api/inventory';
  //private apiUrl = 'https://localhost:7125/api/inventory';
  //private apiUrl = '/api/inventory';


  // Optional signal for tracking transaction status
  isProcessing = signal<boolean>(false);

  // 1. Stock In method
  stockIn(data: InventoryTransaction): Observable<any> {
    this.isProcessing.set(true);
    return this.http.post(`${this.apiUrl}/stock-in`, data).pipe(
      tap(() => {
        this.isProcessing.set(false);
        // Refresh product list after stock in
        this.productService.getProducts().subscribe();
      })
    );
  }

  // 2. Stock Out method
  stockOut(data: InventoryTransaction): Observable<any> {
    this.isProcessing.set(true);
    return this.http.post(`${this.apiUrl}/stock-out`, data).pipe(
      tap(() => {
        this.isProcessing.set(false);
        // Refresh product list after stock out
        this.productService.getProducts().subscribe();
      })
    );
  }

  // Get transaction history
  getTransactionHistory(): Observable<TransactionHistory[]> {
    return this.http.get<TransactionHistory[]>(`${this.apiUrl}/history`);
  }

  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }

  // Get chart data for the last 7 days
  getWeeklyChartData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/weekly-chart`);
  }
  
  getInventoryReport(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/report`); 
  }

  // Get low-stock products for dashboard
  getLowStockProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/low-stock`);
  }

  // Filter history by date range
  getHistoryByDate(fromDate: string, toDate: string): Observable<TransactionHistory[]> {
    return this.http.get<TransactionHistory[]>(`${this.apiUrl}/history/filter?from=${fromDate}&to=${toDate}`);
  }

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`); 
  }
}