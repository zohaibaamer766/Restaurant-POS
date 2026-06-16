import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Order } from '../models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-page">
      <div class="history-header">
        <h1>Order History</h1>
        <button class="btn btn--ghost" (click)="load()">↻ Refresh</button>
      </div>

      <div *ngIf="loading" class="empty-state">
        <div class="spinner"></div>
        <p class="empty-sub" style="margin-top:12px">Loading…</p>
      </div>

      <div *ngIf="!loading && orders.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-title">No orders yet</p>
        <p class="empty-sub">Completed orders will appear here</p>
      </div>

      <div *ngIf="!loading && orders.length > 0" class="table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Placed</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td><strong>#{{ o.orderNumber }}</strong></td>
              <td>{{ o.createdAt | date:'HH:mm:ss' }}</td>
              <td>
                <span *ngFor="let item of o.items" class="item-chip">
                  {{ item.quantity }}× {{ item.menuItemName }}
                </span>
              </td>
              <td><strong>PKR {{ o.total | number:'1.2-2' }}</strong></td>
              <td>
                <span class="status-badge" [class]="'status-badge--' + o.status.toLowerCase()">
                  {{ o.status }}
                </span>
              </td>
              <td>{{ duration(o) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .history-page { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .history-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
      h1 { font-size: 20px; font-weight: 700; color: var(--brand-navy); }
    }
    .table-wrap {
      overflow-x: auto; border-radius: var(--radius);
      border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm);
    }
    .history-table {
      width: 100%; border-collapse: collapse; background: #fff;
      th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--gray-200); font-size: 13px; }
      th { background: var(--gray-50); font-weight: 700; color: var(--gray-500); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--gray-50); }
    }
    .item-chip {
      display: inline-block; background: var(--gray-100); border-radius: 4px;
      padding: 1px 6px; margin: 2px; font-size: 11px;
    }
  `],
})
export class HistoryComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getOrderHistory().subscribe({
      next: orders => { this.orders = orders; this.loading = false; },
      error: ()    => { this.loading = false; },
    });
  }

  duration(o: Order): string {
    if (!o.completedAt) return '—';
    const ms   = new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }
}