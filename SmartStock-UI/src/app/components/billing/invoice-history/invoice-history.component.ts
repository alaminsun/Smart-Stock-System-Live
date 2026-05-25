import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../services/invoice.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-invoice-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-history.component.html'
})
export class InvoiceHistoryComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private toastr = inject(ToastrService);

  invoices = signal<any[]>([]);

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoiceService.getAllInvoices().subscribe({
      next: (res) => this.invoices.set(res),
      error: (err) => this.toastr.error('Failed to load invoices')
    });
  }

  viewDetails(id: string) {
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (res) => {
        this.generatePDF(res);
      },
      error: (err) => this.toastr.error('Failed to load invoice details')
    });
  }

  onDelete(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Stock will be reverted and invoice will be deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.invoiceService.deleteInvoice(id).subscribe({
          next: () => {
            this.toastr.success('Invoice deleted successfully');
            this.loadInvoices();
          },
          error: (err) => this.toastr.error('Failed to delete invoice')
        });
      }
    });
  }

  generatePDF(invoice: any) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text('SmartStock System', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Sales Invoice & Cash Memo', 105, 28, { align: 'center' });
    doc.line(20, 32, 190, 32);

    // Info section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 20, 45);
    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 20, 52);

    doc.text('Bill To:', 140, 45);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoice.customer?.name || 'Walk-in Customer'}`, 140, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: ${invoice.customer?.phone || 'N/A'}`, 140, 58);

    // Product list table
    const tableData = invoice.invoiceItems.map((item: any, index: number) => [
      index + 1,
      item.product?.name || 'Unknown Product',
      item.quantity,
      `€${item.unitPrice.toFixed(2)}`,
      `€${item.subTotal.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['#', 'Product Name', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] }
    });

    // Summary section (Fixed Overlapping)
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const labelX = 135; 
    const amountX = 195; 

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Sub-Total
    doc.text(`Sub-Total:`, labelX, finalY);
    doc.text(`€${invoice.totalAmount.toFixed(2)}`, amountX, finalY, { align: 'right' });

    // VAT
    doc.text(`VAT (${invoice.taxRate}%):`, labelX, finalY + 8);
    doc.text(`+ €${invoice.taxAmount.toFixed(2)}`, amountX, finalY + 8, { align: 'right' });

    // Discount
    doc.text(`Discount:`, labelX, finalY + 16);
    doc.text(`- €${invoice.discount.toFixed(2)}`, amountX, finalY + 16, { align: 'right' });

    // Separation line
    doc.setLineWidth(0.5);
    doc.line(labelX, finalY + 20, amountX, finalY + 20);

    // Grand Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, labelX, finalY + 30);
    doc.text(`€${invoice.netAmount.toFixed(2)}`, amountX, finalY + 30, { align: 'right' });

    // Save PDF
    doc.save(`Invoice_${invoice.invoiceNo}.pdf`);
  }
}