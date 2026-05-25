import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Product {
  id?: string; // Guid matches string in TS
  name: string;
  sku: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minStockLevel: number;
  categoryId: number;
  categoryName?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5049/api/Products';
  //private apiUrl = 'https://localhost:7125/api/Products';
  //private apiUrl = '/api/Products';


  // Global signal for instant UI updates
  products = signal<Product[]>([]);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      tap({
        next: (res) => {
          console.log('Products loaded:', res);
          this.products.set(res || []);
        },
        error: (err) => {
          console.error('Error fetching products:', err);
          this.products.set([]); // Clear on error
        }
      })
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  saveProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: string, product: Product): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  bulkUpload(products: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-upload`, products).pipe(
      tap(() => this.getProducts().subscribe())
    );
  }
  // generateProductDescription(productName: string): Observable<{ description: string }> {
  // // আপনার প্রজেক্টের apiUrl (e.g., https://localhost:7125/api) ব্যবহার করুন
  // return this.http.get<{ description: string }>(`${this.apiUrl}/Ai/generate-description?productName=${productName}`);
  // }
  private aiUrl = 'http://localhost:5049/api/Ai';

  analyzeInventory(): Observable<{ report: string }> {
    return this.http.get<{ report: string }>(`${this.aiUrl}/analyze-inventory`);
  }

  chatWithAi(message: string): Observable<{ answer: string }> {
    return this.http.post<{ answer: string }>(`${this.aiUrl}/chat`, { message });
  }

  generateProductDescription(productName: string): Observable<{ description: string, sku: string }> {
    return this.http.get<{ description: string, sku: string }>(`${this.aiUrl}/generate-description?productName=${productName}`);
  }
}