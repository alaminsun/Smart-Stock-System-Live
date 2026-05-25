import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogService } from '../../../services/audit.service';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-log.component.html',
  //styleUrl: './activity-log.component.scss'
})
export class ActivityLogComponent implements OnInit {
  private auditService = inject(AuditLogService);
  public authService = inject(AuthService);

  logs = signal<any[]>([]);
  totalItems = signal<number>(0);
  currentPage = signal<number>(1);

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.auditService.getAuditLogs(this.currentPage(), 20).subscribe({
      next: (res) => {
        this.logs.set(res.logs);
        this.totalItems.set(res.totalItems);
      },
      error: (err) => console.error('Error loading logs', err)
    });
  }

  // Helper method to parse JSON data for easier reading
  parseJson(jsonStr: string): any {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }

  // Extract key-value pairs from an object
  getProperties(obj: any): {key: string, value: any}[] {
    if (!obj) return [];
    return Object.keys(obj).map(k => ({ key: k, value: obj[k] }));
  }
}