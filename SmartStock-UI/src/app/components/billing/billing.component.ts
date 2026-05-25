import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProductService } from '../../services/product.service';
import { InvoiceService } from '../../services/invoice.service';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './billing.component.html'
})
export class BillingComponent implements OnInit {
  public authService = inject(AuthService);
  private productService = inject(ProductService);
  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);
  public inventoryService = inject(InventoryService);
  private toastr = inject(ToastrService);

  // Data lists
  products = signal<any[]>([]);
  customers = signal<any[]>([]);
  
  // Form model
  selectedCustomerId = '';
  selectedProductId = '';
  quantity = 1;
  discount = 0;
  taxRate = 20;

  // Temporary list of invoice items
  invoiceItems = signal<any[]>([]);

  // VAT Calculation
  taxAmount = computed(() => {
    return (this.totalAmount() * this.taxRate) / 100;
  });

  // Calculation (Computed Signals)
  totalAmount = computed(() => {
    return this.invoiceItems().reduce((acc, item) => acc + item.subTotal, 0);
  });

  netAmount = computed(() => {
    return (this.totalAmount() + this.taxAmount()) - this.discount;
  });

  ngOnInit() {
    console.log('BillingComponent Initialized');
    this.loadInitialData();
  }

  loadInitialData() {
    this.productService.getProducts().subscribe({
      next: res => {
        console.log('Products loaded:', res);
        this.products.set(res);
      },
      error: err => {
        console.error('Error loading products:', err);
        this.toastr.error('Failed to load products', 'Error');
      }
    });

    this.customerService.getCustomers().subscribe({
      next: res => {
        console.log('Customers loaded:', res);
        this.customers.set(res);
      },
      error: err => {
        console.error('Error loading customers:', err);
        this.toastr.error('Failed to load customers', 'Error');
      }
    });
  }

  addItem() {
    if (!this.selectedCustomerId) {
      this.toastr.warning('Please select a customer first', 'Required');
      return;
    }

    if (this.quantity <= 0) {
      this.toastr.warning('Quantity must be greater than 0', 'Invalid Quantity');
      return;
    }

    const product = this.products().find(p => p.id === this.selectedProductId);
    
    if (!product) {
      this.toastr.warning('Please select a product', 'Required');
      return;
    }

    if (this.quantity > product.quantity) {
      this.toastr.error(`Not enough stock! Available: ${product.quantity}`, 'Insufficient Stock');
      return;
    }

    // Increase quantity if item already in list
    const existingItem = this.invoiceItems().find(i => i.productId === product.id);
    if (existingItem) {
      const totalRequested = existingItem.quantity + this.quantity;
      if (totalRequested > product.quantity) {
        this.toastr.error('Total quantity exceeds available stock!', 'Stock Error');
        return;
      }
      existingItem.quantity += this.quantity;
      existingItem.subTotal = existingItem.quantity * existingItem.unitPrice;
      this.invoiceItems.set([...this.invoiceItems()]);
    } else {
      // Add new item
      const newItem = {
        productId: product.id,
        productName: product.name,
        unitPrice: product.salePrice,
        quantity: this.quantity,
        subTotal: product.salePrice * this.quantity
      };
      this.invoiceItems.set([...this.invoiceItems(), newItem]);
    }

    this.toastr.success('Item added to cart', 'Success');
    
    // Reset form fields after adding item
    this.selectedProductId = '';
    this.quantity = 1;
  }

  removeItem(index: number) {
    const currentItems = this.invoiceItems();
    currentItems.splice(index, 1);
    this.invoiceItems.set([...currentItems]);
  }

  submitInvoice() {
    if (!this.selectedCustomerId || this.invoiceItems().length === 0) {
      this.toastr.error('Please select a customer and add at least one item.', 'Validation Error');
      return;
    }

    const invoiceData = {
      customerId: this.selectedCustomerId,
      totalAmount: this.totalAmount(),
      discount: this.discount,
      netAmount: this.netAmount(),
      taxRate: this.taxRate,
      taxAmount: this.taxAmount(),
      invoiceItems: this.invoiceItems().map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subTotal: item.subTotal
      }))
    };

    console.log('Submitting invoice data:', invoiceData);
    this.invoiceService.createInvoice(invoiceData).subscribe({
      next: (res) => {
        // Use SweetAlert for success notification
        Swal.fire({
          title: 'Invoice Created!',
          text: `Invoice No: ${res.invoiceNo} generated successfully.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
        
        // Generate PDF
        this.generateInvoicePDF(res);
        
        // Reset form
        this.resetForm();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Could not save invoice', 'Server Error');
      }
    });
  }

  generateInvoicePDF(invoice: any) {
    const doc = new jsPDF();
    const customer = this.customers().find(c => c.id === invoice.customerId);

    // 1. Header
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text('SmartStock System', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Sales Invoice & Cash Memo', 105, 28, { align: 'center' });
    doc.line(20, 32, 190, 32);

    // 2. Invoice and Customer info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 20, 45);
    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 20, 52);

    doc.text('Bill To:', 140, 45);
    doc.setFont('helvetica', 'bold');
    doc.text(`${customer?.name || 'Walk-in Customer'}`, 140, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: ${customer?.phone || 'N/A'}`, 140, 58);

    // 3. Items Table
    const itemsToPrint = invoice.invoiceItems || this.invoiceItems();
    
    const tableData = itemsToPrint.map((item: any, index: number) => [
      index + 1,
      item.product?.name || item.productName || 'Product',
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

    // 4. Summary Calculations
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const rightAlignX = 190;
    const labelX = 140;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Sub-Total
    doc.text(`Sub-Total:`, labelX, finalY);
    doc.text(`€${invoice.totalAmount.toFixed(2)}`, rightAlignX, finalY, { align: 'right' });

    // VAT
    doc.text(`VAT (${invoice.taxRate}%):`, labelX, finalY + 8);
    doc.text(`+ €${invoice.taxAmount.toFixed(2)}`, rightAlignX, finalY + 8, { align: 'right' });

    // Discount
    doc.text(`Discount:`, labelX, finalY + 16);
    doc.text(`- €${invoice.discount.toFixed(2)}`, rightAlignX, finalY + 16, { align: 'right' });

    // Separation Line
    doc.setLineWidth(0.5);
    doc.line(labelX, finalY + 20, rightAlignX, finalY + 20);

    // Grand Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Grand Total:`, labelX, finalY + 30);
    doc.text(`€${invoice.netAmount.toFixed(2)}`, rightAlignX, finalY + 30, { align: 'right' });

    // 5. Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 105, 285, { align: 'center' });

    // 6. Save PDF
    doc.save(`Invoice_${invoice.invoiceNo}.pdf`);
}

  resetForm() {
    this.invoiceItems.set([]);
    this.selectedCustomerId = '';
    this.selectedProductId = ''; // Reset product
    this.quantity = 1;          // Reset quantity
    this.discount = 0;          // Reset discount
  }
}