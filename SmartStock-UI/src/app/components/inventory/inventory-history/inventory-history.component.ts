import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, TransactionHistory } from '../../../services/inventory.service'; // Import interfaces
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-history.component.html'
})
export class InventoryHistoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private toastr = inject(ToastrService);
  allTransactions = signal<TransactionHistory[]>([]);
  searchTerm = signal<string>('');
  filterType = signal<string>('All');

  // Filter logic
  filteredTransactions = computed(() => {
    return this.allTransactions().filter(t => {
      const search = this.searchTerm().toLowerCase();
      const matchesSearch = t.productName.toLowerCase().includes(search) ||
                            (t.customerName && t.customerName.toLowerCase().includes(search)) ||
                            (t.supplierName && t.supplierName.toLowerCase().includes(search));
      
      const matchesType = this.filterType() === 'All' || t.transactionType === this.filterType();
      
      return matchesSearch && matchesType;
    });
  });

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.inventoryService.getTransactionHistory().subscribe({
      next: (res) => {
        this.allTransactions.set(res);
      },
      error: (err) => console.error('Error loading history:', err)
    });
  }

  downloadPDF() {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Header section
    doc.setFontSize(18);
    doc.text('SmartStock Inventory Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${timestamp}`, 14, 30);

    // Prepare table data
    const tableData = this.allTransactions().map(t => [
      new Date(t.transactionDate).toLocaleDateString(),
      t.productName,
      t.transactionType === 'StockIn' ? 'PURCHASE' : 'SALE',
      t.quantity,
      t.transactionType === 'StockIn' ? t.supplierName : t.customerName
    ]);

    // Auto-table configuration
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Product', 'Type', 'Qty', 'Party']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [13, 110, 253] }, // Primary color
      styles: { fontSize: 9 }
    });

    // Save PDF
    doc.save(`Inventory_Report_${new Date().getTime()}.pdf`);
  }

    filterByDate(from: string, to: string) {
    if (!from || !to) {
        this.toastr.warning('Please select both start and end dates.', 'Validation Error');
        return;
    }

    this.inventoryService.getHistoryByDate(from, to).subscribe({
        next: (res) => {
        this.allTransactions.set(res);
        this.toastr.success(`${res.length} transactions found.`, 'Success');
        },
        error: (err) => {
        this.toastr.error('Failed to filter history!', 'Error');
        console.error(err);
        }
    });
    }
}