import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService }    from '../services/api.service';
import { SignalrService } from '../services/signalr.service';
import { Order, OrderStatus } from '../models/models';

type Tab = { status: OrderStatus; label: string; icon: string };

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kitchen-wrapper">

      <!-- ── Tab Bar ──────────────────────────────────────── -->
      <div class="tab-bar">
        <button
          *ngFor="let tab of tabs"
          class="tab"
          [class.tab--active]="activeTab === tab.status"
          (click)="setTab(tab.status)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span
            *ngIf="countFor(tab.status) > 0"
            class="tab-badge"
            [class.tab-badge--urgent]="tab.status === 'Pending'"
          >
            {{ countFor(tab.status) }}
          </span>
        </button>

        <!-- Refresh button -->
        <button class="tab-refresh btn btn--icon btn--sm" (click)="loadOrders()" [disabled]="loading" title="Refresh orders">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               [style.animation]="loading ? 'spin 0.6s linear infinite' : 'none'">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      <!-- ── Orders Area ──────────────────────────────────── -->
      <div class="orders-area">

        <!-- Loading -->
        <div *ngIf="loading && orders.length === 0" class="empty-state">
          <div class="spinner"></div>
          <p class="empty-sub" style="margin-top:12px">Loading orders…</p>
        </div>

        <!-- Empty state per tab -->
        <div *ngIf="!loading && visibleOrders.length === 0" class="empty-state">
          <div class="empty-icon">{{ emptyIcon }}</div>
          <p class="empty-title">{{ emptyTitle }}</p>
          <p class="empty-sub">{{ emptySub }}</p>
        </div>

        <!-- Order cards grid -->
        <div *ngIf="visibleOrders.length > 0" class="order-grid">
          <div
            *ngFor="let order of visibleOrders; trackBy: trackById"
            class="order-card"
            [class]="'order-card--' + order.status.toLowerCase()"
          >
            <!-- Card header -->
            <div class="order-card-header">
              <div class="order-number">#{{ order.orderNumber }}</div>
              <span class="status-badge" [class]="'status-badge--' + order.status.toLowerCase()">
                {{ order.status }}
              </span>
              <div class="order-age" [class.order-age--urgent]="isUrgent(order)">
                {{ getAge(order) }}
              </div>
            </div>

            <!-- Items list -->
            <div class="order-items">
              <div *ngFor="let item of order.items" class="order-item-row">
                <span class="item-qty">{{ item.quantity }}×</span>
                <span class="item-name">{{ item.menuItemName }}</span>
                <span class="item-cat-icon">
                  {{ item.category === 'HotFood' ? '🔥' : '🧊' }}
                </span>
              </div>
            </div>

            <!-- Card footer -->
            <div class="order-card-footer">
              <!-- Timestamps -->
              <div class="order-timestamps">
                <div class="ts-row">
                  <span class="ts-label">Placed</span>
                  <span class="ts-val">{{ order.createdAt | date:'HH:mm' }}</span>
                </div>
                <div *ngIf="order.kitchenStartedAt" class="ts-row">
                  <span class="ts-label">Started</span>
                  <span class="ts-val">{{ order.kitchenStartedAt | date:'HH:mm' }}</span>
                </div>
                <div *ngIf="order.readyAt" class="ts-row">
                  <span class="ts-label">Ready</span>
                  <span class="ts-val">{{ order.readyAt | date:'HH:mm' }}</span>
                </div>
              </div>

              <div class="order-total">PKR {{ order.total | number:'1.2-2' }}</div>

              <!-- Action buttons -->
              <div class="order-actions">
                <!-- Cancel: only Pending orders, acts like cashier cancel -->
                <button
                  *ngIf="order.status === 'Pending'"
                  class="btn btn--danger btn--sm"
                  (click)="cancelOrder(order)"
                  [disabled]="busy[order.id]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  Cancel
                </button>

                <!-- Advance button — changes label per status -->
                <button
                  *ngIf="order.status !== 'Completed'"
                  class="btn btn--sm advance-btn"
                  [class]="advanceBtnStyle(order.status)"
                  (click)="advance(order)"
                  [disabled]="busy[order.id]"
                >
                  <span *ngIf="busy[order.id]" class="spinner" style="width:12px;height:12px;border-width:2px;border-top-color:#fff"></span>
                  <ng-container *ngIf="!busy[order.id]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <ng-container *ngIf="order.status === 'Pending'"><polygon points="5 3 19 12 5 21 5 3"/></ng-container>
                      <ng-container *ngIf="order.status === 'Preparing'"><polyline points="20 6 9 17 4 12"/></ng-container>
                      <ng-container *ngIf="order.status === 'Ready'"><path d="M5 12h14M12 5l7 7-7 7"/></ng-container>
                    </svg>
                    {{ advanceBtnLabel(order.status) }}
                  </ng-container>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .kitchen-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* ── Tab Bar ────────────────────────────────────────── */
    .tab-bar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: #fff;
      border-bottom: 1px solid var(--gray-200);
      flex-shrink: 0;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 13px;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-sm);
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-500);
      transition: all 0.15s;
      white-space: nowrap;

      &:hover { background: var(--gray-100); color: var(--gray-700); }

      &--active {
        background: var(--brand-navy);
        color: #fff;
        border-color: var(--brand-navy);
      }
    }
    .tab-icon  { font-size: 13px; }
    .tab-label { }
    .tab-badge {
      background: var(--gray-200);
      color: var(--gray-600);
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 99px;
      min-width: 18px;
      text-align: center;

      &--urgent {
        background: var(--brand-red);
        color: #fff;
        animation: pulse-badge 1.5s ease-in-out infinite;
      }
    }
    @keyframes pulse-badge {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.7; }
    }
    .tab-refresh {
      margin-left: auto;
      svg { color: var(--gray-400); }
    }

    /* ── Orders Area ────────────────────────────────────── */
    .orders-area {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .order-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* ── Order Card ─────────────────────────────────────── */
    .order-card {
      background: #fff;
      border: 1.5px solid var(--gray-200);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.2s;

      &:hover { box-shadow: var(--shadow); }

      /* Left accent stripe */
      border-left-width: 4px;
      &--pending   { border-left-color: var(--status-pending-dot);   }
      &--preparing { border-left-color: var(--status-preparing-dot); }
      &--ready     { border-left-color: var(--status-ready-dot);     }
    }

    /* Card header */
    .order-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px 8px;
      border-bottom: 1px solid var(--gray-100);
    }
    .order-number {
      font-size: 18px;
      font-weight: 800;
      color: var(--brand-navy);
      font-family: 'JetBrains Mono', monospace;
      flex: 1;
    }
    .order-age {
      font-size: 11px;
      color: var(--gray-400);
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      &--urgent { color: #DC2626; font-weight: 700; }
    }

    /* Items */
    .order-items {
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .order-item-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .item-qty  {
      font-weight: 700;
      color: var(--brand-red);
      min-width: 22px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }
    .item-name { flex: 1; color: var(--gray-900); font-weight: 500; }
    .item-cat-icon { font-size: 13px; }

    /* Card footer */
    .order-card-footer {
      padding: 10px 14px;
      border-top: 1px solid var(--gray-100);
      background: var(--gray-50);
      display: flex;
      align-items: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Timestamps */
    .order-timestamps {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }
    .ts-row {
      display: flex;
      gap: 6px;
      font-size: 11px;
    }
    .ts-label {
      color: var(--gray-400);
      min-width: 44px;
      font-weight: 500;
    }
    .ts-val {
      color: var(--gray-700);
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }

    .order-total {
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-700);
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
      align-self: center;
    }

    /* Actions */
    .order-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .advance-btn {
      &.btn--primary { }
      &.btn--success { }
      &.btn--amber   { }
    }
  `],
})
export class KitchenComponent implements OnInit, OnDestroy {
  orders:    Order[] = [];
  loading    = true;
  activeTab: OrderStatus = 'Pending';
  busy: Record<string, boolean> = {};

  readonly tabs: Tab[] = [
    { status: 'Pending',   label: 'Pending',   icon: '⏳' },
    { status: 'Preparing', label: 'Preparing', icon: '🍳' },
    { status: 'Ready',     label: 'Ready',     icon: '✅' },
  ];

  private sub!: Subscription;
  private timer!: ReturnType<typeof setInterval>;

  constructor(private api: ApiService, private signalr: SignalrService) {}

  ngOnInit(): void {
    this.loadOrders();
    // Re-fetch on any SignalR broadcast (order placed / advanced / cancelled)
    this.sub = this.signalr.ordersUpdated$.subscribe(() => this.loadOrders());
    // Refresh age display every 30 seconds
    this.timer = setInterval(() => {}, 30_000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearInterval(this.timer);
  }

  loadOrders(): void {
    this.loading = true;
    this.api.getActiveOrders().subscribe({
      next:  orders => { this.orders = orders; this.loading = false; },
      error: ()     => { this.loading = false; },
    });
  }

  setTab(status: OrderStatus): void { this.activeTab = status; }

  get visibleOrders(): Order[] {
    return this.orders.filter(o => o.status === this.activeTab);
  }

  countFor(status: OrderStatus): number {
    return this.orders.filter(o => o.status === status).length;
  }

  trackById(_: number, order: Order): string { return order.id; }

  /* ── Age display ──────────────────────────────────── */
  getAge(order: Order): string {
    const ms   = Date.now() - new Date(order.createdAt).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return 'Just now';
    return `${mins}m ago`;
  }

  isUrgent(order: Order): boolean {
    const ms = Date.now() - new Date(order.createdAt).getTime();
    return ms > 10 * 60_000; // > 10 minutes
  }

  /* ── Empty state per tab ──────────────────────────── */
  get emptyIcon(): string {
    if (this.activeTab === 'Pending')   return '⏳';
    if (this.activeTab === 'Preparing') return '🍳';
    return '✅';
  }
  get emptyTitle(): string {
    if (this.activeTab === 'Pending')   return 'No orders waiting';
    if (this.activeTab === 'Preparing') return 'Nothing in progress';
    return 'Nothing ready yet';
  }
  get emptySub(): string {
    if (this.activeTab === 'Pending')   return 'New orders from the cashier will appear here';
    if (this.activeTab === 'Preparing') return 'Start a pending order to see it here';
    return 'Mark an order ready to see it here';
  }

  /* ── Actions ──────────────────────────────────────── */
  advance(order: Order): void {
    if (this.busy[order.id]) return;
    this.busy[order.id] = true;

    this.api.advanceOrder(order.id).subscribe({
      next: updated => {
        this.busy[order.id] = false;
        // Replace order in list with updated version
        const idx = this.orders.findIndex(o => o.id === updated.id);
        if (idx >= 0) this.orders[idx] = updated;
        // If order completed, remove from active list
        if (updated.status === 'Completed') {
          this.orders = this.orders.filter(o => o.id !== updated.id);
        }
        // Auto-switch tab to follow the order
        if (updated.status !== 'Completed') {
          this.activeTab = updated.status;
        }
      },
      error: err => {
        this.busy[order.id] = false;
        alert(err.error?.error ?? 'Could not advance order status.');
      },
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm(`Cancel order #${order.orderNumber}?\nThis cannot be undone.`)) return;
    this.busy[order.id] = true;

    this.api.cancelOrder(order.id).subscribe({
      next: () => {
        this.busy[order.id] = false;
        this.orders = this.orders.filter(o => o.id !== order.id);
      },
      error: err => {
        this.busy[order.id] = false;
        alert(err.error?.error ?? 'Cannot cancel this order.');
      },
    });
  }

  advanceBtnLabel(status: OrderStatus): string {
    if (status === 'Pending')   return 'Start Preparing';
    if (status === 'Preparing') return 'Mark Ready';
    if (status === 'Ready')     return 'Complete Order';
    return '';
  }

  advanceBtnStyle(status: OrderStatus): string {
    if (status === 'Pending')   return 'btn--primary';
    if (status === 'Preparing') return 'btn--success';
    if (status === 'Ready')     return 'btn--amber';
    return '';
  }
}
