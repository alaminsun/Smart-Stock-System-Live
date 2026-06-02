import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportService } from '../../../services/report.service';
import { SettingsService } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profit-loss',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profit-loss.component.html',
//   styleUrl: './profit-loss.component.scss'
})
export class ProfitLossComponent implements OnInit {
  //private reportService = inject(DashboardService);
  public reportService = inject(ReportService);
  public authService = inject(AuthService);
  public settingsService = inject(SettingsService);

  // Signals for Data Binding
  reportData = signal<any>(null);
  currentPeriod = signal<string>('month');

  ngOnInit() {
    this.loadStatement('month');
  }

  loadStatement(period: string) {
    this.currentPeriod.set(period);
    this.reportService.getProfitLossStatement(period).subscribe({
      next: (data) => this.reportData.set(data),
      error: (err) => console.error('Error loading P&L Statement', err)
    });
  }

  exportToPDF() {
    const data = this.reportData();
    if (!data) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Profit & Loss Statement', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Period: ${this.currentPeriod().toUpperCase()}`, 14, 32);
    doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 37);
    doc.line(14, 40, 196, 40);

    const currency = this.settingsService.settings()['CurrencySymbol'] || '৳';

    // Summary Table
    autoTable(doc, {
      startY: 45,
      head: [['Financial Metric', `Amount (${currency})`]],
      body: [
        ['Total Sales Revenue', data.totalSales.toFixed(2)],
        ['Cost of Goods Sold (COGS)', data.costOfGoodsSold.toFixed(2)],
        ['Net Profit', data.netProfit.toFixed(2)],
        ['Profit Margin', `${data.profitMargin}%`]
      ],
      theme: 'striped'
    });

    // Product Breakdown Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Product Name', 'Qty Sold', 'Revenue', 'Cost', 'Net Profit']],
      body: data.products.map((p: any) => [
        p.productName,
        p.quantitySold,
        `${currency}${p.totalRevenue.toFixed(2)}`,
        `${currency}${p.totalCost.toFixed(2)}`,
        `${currency}${p.netProfit.toFixed(2)}`
      ])
    });

    doc.save(`PL_Statement_${this.currentPeriod()}.pdf`);
  }
}