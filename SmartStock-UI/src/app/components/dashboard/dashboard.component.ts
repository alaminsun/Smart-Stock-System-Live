import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { InventoryService } from '../../services/inventory.service';
import { DashboardService } from '../../services/dashboard.service';
import { Chart, registerables } from 'chart.js';
import { timer } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  // ... existing ViewChilds
  @ViewChild('stockChart') stockChart!: ElementRef;
  @ViewChild('pieChart') pieChartCanvas!: ElementRef;

  // AI Signals
  aiReport = signal<string>('');
  isAnalyzing = signal<boolean>(false);
  isChatOpen = signal<boolean>(false); // চ্যাটবক্স ওপেন/ক্লোজ স্টেট
  chatMessages = signal<{role: string, text: string}[]>([]);
  userMessage = signal<string>('');
  isChatLoading = signal<boolean>(false);

  // ... rest of signals and services
  public productService = inject(ProductService);
  public authService = inject(AuthService);
  public settingsService = inject(SettingsService);
  private inventoryService = inject(InventoryService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  recentInvoices = signal<any[]>([]);
  topProducts = signal<any[]>([]);
  userPerformance = signal<any[]>([]);
  lowStockProducts = signal<any[]>([]);
  summary = signal<any>(null);
  
  todaySales = signal<number>(0);
  totalRevenue = signal<number>(0);
  salesGrowth = signal<number>(0);
  netProfit = signal<number>(0);
  profitMargin = signal<number>(0);
  selectedPeriod = signal<string>('today');
  
  todayDate = new Date();
  private charts: any[] = [];

  ngOnInit() {
    this.chatMessages.set([{role: 'ai', text: 'হ্যালো! আমি আপনার স্মার্টস্টক অ্যাসিস্ট্যান্ট। আমি কীভাবে সাহায্য করতে পারি?'}]);
    timer(0, 60000).subscribe(() => {
      this.loadAllData();
    });
  }

  // AI Analysis Logic
  generateAiReport() {
    this.isAnalyzing.set(true);
    this.productService.analyzeInventory().subscribe({
      next: (res) => {
        this.aiReport.set(res.report);
        this.isAnalyzing.set(false);
      },
      error: () => this.isAnalyzing.set(false)
    });
  }

  // Chatbot Logic
  sendMessage() {
    const msg = this.userMessage().trim();
    if (!msg) return;

    this.chatMessages.update(prev => [...prev, {role: 'user', text: msg}]);
    this.userMessage.set('');
    this.isChatLoading.set(true);

    this.productService.chatWithAi(msg).subscribe({
      next: (res) => {
        this.chatMessages.update(prev => [...prev, {role: 'ai', text: res.answer}]);
        this.isChatLoading.set(false);
      },
      error: () => {
        this.chatMessages.update(prev => [...prev, {role: 'ai', text: 'দুঃখিত, আমি এখন উত্তর দিতে পারছি না।'}]);
        this.isChatLoading.set(false);
      }
    });
  }

  // ... keep existing methods (quickStockIn, loadAllData, renderPieChart, renderLineChart, totalInventoryValue, exportReport, onPeriodChange, updateDashboardSignals)


quickStockIn(productId: string) {
  // Stock In পেজে পাঠিয়ে দিন এবং কুয়েরি প্যারামিটারে আইডি দিন
  this.router.navigate(['/inventory/stock-in'], { queryParams: { id: productId } });
}
  private loadAllData() {
    // সব ডাটা লোড করার একটি মেইন ফাংশন
    this.dashboardService.getDashboardStats(this.selectedPeriod()).subscribe({
      next: (data) => {
        this.updateDashboardSignals(data);
      },
      error: (err) => console.error('Dashboard Stats Error:', err)
    });

    this.inventoryService.getDashboardSummary().subscribe(res => this.summary.set(res));
    this.inventoryService.getLowStockProducts().subscribe(res => this.lowStockProducts.set(res));
    
    // লাইন চার্ট লোড
    this.inventoryService.getWeeklyChartData().subscribe(data => {
      if (this.stockChart?.nativeElement) this.renderLineChart(data);
    });
  }

  private renderPieChart(products: any[]) {
  if (!this.pieChartCanvas?.nativeElement || !products || products.length === 0) return;
  
  const ctx = this.pieChartCanvas.nativeElement;
  // আগের চার্ট থাকলে ডিলিট করা
  Chart.getChart(ctx)?.destroy();

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      // এখানে p.productName ব্যবহার করুন (সার্ভারের ডাটা অনুযায়ী)
      labels: products.map(p => p.productName), 
      datasets: [{
        label: 'Quantity Sold',
        // এখানে p.totalSold ব্যবহার করুন (সার্ভারের ডাটা অনুযায়ী)
        data: products.map(p => p.totalSold),
        backgroundColor: [
          '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
        ],
        hoverOffset: 4
      }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    }
  });
}

  private renderLineChart(data: any[]) {
    const ctx = this.stockChart.nativeElement;
    Chart.getChart(ctx)?.destroy();

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          { label: 'Stock In', data: data.map(d => d.in), borderColor: '#0d6efd', fill: true, tension: 0.4 },
          { label: 'Stock Out', data: data.map(d => d.out), borderColor: '#ffc107', fill: true, tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  get totalInventoryValue() {
    return this.productService.products().reduce((acc, p) => acc + (p.salePrice * p.quantity), 0);
  }

  exportReport() {
    const doc = new jsPDF();
    const currency = this.settingsService.settings()['CurrencySymbol'] || '৳';
    const company = this.settingsService.settings()['CompanyName'] || 'SmartStock';

    doc.setFontSize(22);
    doc.text(`${company} Performance Report`, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated by: ${this.authService.user()?.fullName || 'Admin'}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 35);
    doc.line(14, 38, 196, 38);

    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ["Today's Revenue", `${currency}${this.todaySales()}`],
        ["Total Revenue", `${currency}${this.totalRevenue()}`]
      ]
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Invoice No', 'Customer', 'Created By', 'Amount']],
      body: this.recentInvoices().map(inv => [inv.invoiceNo, inv.customerName || 'Walk-in', inv.createdBy || 'N/A', `${currency}${inv.netAmount}`])
    });

    doc.save(`Report_${this.todayDate.getTime()}.pdf`);
  }

  onPeriodChange(event: any) {
  const period = event.target.value;
  this.selectedPeriod.set(period);
  this.dashboardService.getDashboardStats(period).subscribe(data => {
    this.updateDashboardSignals(data); // সিগন্যাল আপডেট করার মেথড
  });
}
private updateDashboardSignals(data: any) {
  this.todaySales.set(data.todaySales || 0);
  this.totalRevenue.set(data.totalRevenue || 0);
  this.recentInvoices.set(data.recentTransactions || []);
  this.topProducts.set(data.topProducts || []);
  this.userPerformance.set(data.userPerformance || []);
  this.netProfit.set(data.netProfit || 0);
  this.profitMargin.set(data.profitMargin || 0);
  
  // চার্ট আপডেট করা (পাস করা ডাটা অনুযায়ী)
  if (data.topProducts) {
    this.renderPieChart(data.topProducts);
  }
}
}