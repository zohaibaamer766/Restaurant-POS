import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Subscription }   from 'rxjs';
import { ApiService }     from '../services/api.service';
import { CartService }    from '../services/cart.service';
import { MenuItem, CartLine } from '../models/models';

@Component({
  selector: 'app-cashier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cashier-wrapper">

      <!-- ── LEFT: Menu Browser ──────────────────────────── -->
      <div class="menu-panel">

        <!-- Search -->
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search menu…"
            [(ngModel)]="searchTerm"
            autocomplete="off"
          />
          <button *ngIf="searchTerm" class="search-clear" (click)="searchTerm = ''">✕</button>
        </div>

        <!-- Loading -->
        <div *ngIf="menuLoading" class="empty-state">
          <div class="spinner"></div>
          <p class="empty-sub" style="margin-top:12px">Loading menu…</p>
        </div>

        <!-- Menu error -->
        <div *ngIf="menuError && !menuLoading" class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p class="empty-title">Cannot load menu</p>
          <p class="empty-sub">Make sure the backend is running on port 5000</p>
          <button class="btn btn--ghost btn--sm" style="margin-top:12px" (click)="loadMenu()">Retry</button>
        </div>

        <!-- Menu content -->
        <div *ngIf="!menuLoading && !menuError" class="menu-content">

          <!-- Morning drinks banner -->
          <div *ngIf="isMorningDrinkDiscount" class="promo-banner">
            <span class="promo-icon">🧊</span>
            <span>Weekday morning deal — all cold drinks are <strong>half price</strong> before noon!</span>
          </div>

          <!-- No results -->
          <div *ngIf="hotItems.length === 0 && coldItems.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p class="empty-title">No items found</p>
            <p class="empty-sub">Try a different search term</p>
          </div>

          <!-- Hot Food -->
          <div *ngIf="hotItems.length > 0" class="menu-section">
            <div class="section-heading">
              <span class="section-icon">🔥</span>
              <span>Hot Food</span>
              <span class="section-count">{{ hotItems.length }}</span>
            </div>
            <div class="menu-grid">
              <button
                *ngFor="let item of hotItems"
                class="menu-card"
                [class.menu-card--active]="getCartQty(item.id) > 0"
                (click)="addItem(item)"
              >
                <div class="menu-card-name">{{ item.name }}</div>
                <div class="menu-card-footer">
                  <span class="menu-card-price">PKR {{ item.basePrice | number:'1.2-2' }}</span>
                  <span *ngIf="getCartQty(item.id) > 0" class="menu-card-qty">
                    ×{{ getCartQty(item.id) }}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <!-- Cold Drinks -->
          <div *ngIf="coldItems.length > 0" class="menu-section">
            <div class="section-heading">
              <span class="section-icon">🧊</span>
              <span>Cold Drinks</span>
              <span class="section-count">{{ coldItems.length }}</span>
              <span *ngIf="isMorningDrinkDiscount" class="discount-tag">50% OFF</span>
            </div>
            <div class="menu-grid">
              <button
                *ngFor="let item of coldItems"
                class="menu-card menu-card--cold"
                [class.menu-card--active]="getCartQty(item.id) > 0"
                (click)="addItem(item)"
              >
                <div class="menu-card-name">{{ item.name }}</div>
                <div class="menu-card-footer">
                  <span class="menu-card-price">PKR {{ item.basePrice | number:'1.2-2' }}</span>
                  <span *ngIf="isMorningDrinkDiscount" class="menu-card-promo">
                    PKR {{ (item.basePrice * 0.5) | number:'1.2-2' }}
                  </span>
                  <span *ngIf="getCartQty(item.id) > 0" class="menu-card-qty">
                    ×{{ getCartQty(item.id) }}
                  </span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ── RIGHT: Cart ─────────────────────────────────── -->
      <div class="cart-panel">

        <div class="cart-header">
          <div class="cart-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Current Order
            <span *ngIf="cart.itemCount > 0" class="cart-count">{{ cart.itemCount }}</span>
          </div>
          <button
            *ngIf="!cart.isEmpty"
            class="btn btn--ghost btn--sm"
            (click)="cart.clear()"
          >
            Clear all
          </button>
        </div>

        <!-- Empty cart -->
        <div *ngIf="cart.isEmpty" class="empty-state cart-empty">
          <div class="empty-icon">🛒</div>
          <p class="empty-title">No items yet</p>
          <p class="empty-sub">Tap any item on the left to add it to the order</p>
        </div>

        <!-- Cart lines -->
        <div *ngIf="!cart.isEmpty" class="cart-lines">
          <div *ngFor="let line of cartLines" class="cart-line">
            <div class="cart-line-top">
              <span class="cart-line-name">{{ line.menuItem.name }}</span>
              <span class="cart-line-total">PKR {{ line.lineTotal | number:'1.2-2' }}</span>
            </div>

            <!-- Discounts -->
            <div *ngIf="line.appliedDiscounts.length > 0" class="cart-line-discounts">
              <span *ngFor="let d of line.appliedDiscounts" class="discount-tag">{{ d }}</span>
            </div>

            <!-- Price detail (show when discounted) -->
            <div *ngIf="line.effectiveUnitPrice !== line.menuItem.basePrice" class="cart-line-pricing">
              <span class="price-was">PKR {{ line.menuItem.basePrice | number:'1.2-2' }}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              <span class="price-now">PKR {{ line.effectiveUnitPrice | number:'1.2-2' }} each</span>
            </div>

            <!-- Quantity controls -->
            <div class="cart-line-controls">
              <div class="qty-controls">
                <button class="qty-btn" (click)="decrement(line)" aria-label="Decrease">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg>
                </button>
                <span class="qty-value">{{ line.quantity }}</span>
                <button class="qty-btn" (click)="increment(line)" aria-label="Increase">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>
              <button
                class="btn btn--icon btn--sm remove-btn"
                (click)="cart.remove(line.menuItem.id)"
                aria-label="Remove item"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Cart footer -->
        <div class="cart-footer">
          <div class="order-summary">
            <div class="summary-row">
              <span>Items</span>
              <span>{{ cart.itemCount }}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Total</span>
              <span>PKR {{ cartTotal | number:'1.2-2' }}</span>
            </div>
          </div>

          <button
            class="btn btn--primary btn--lg"
            [disabled]="cart.isEmpty || submitting"
            (click)="submitOrder()"
          >
            <span *ngIf="submitting" class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#fff"></span>
            <svg *ngIf="!submitting" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z"/></svg>
            {{ submitting ? 'Sending to kitchen…' : 'Place Order' }}
          </button>

          <div *ngIf="successMsg" class="toast toast--success">{{ successMsg }}</div>
          <div *ngIf="errorMsg"   class="toast toast--error">{{ errorMsg }}</div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .cashier-wrapper {
      display: grid;
      grid-template-columns: 1fr 320px;
      height: 100%;
      overflow: hidden;
    }

    /* ── Menu Panel ─────────────────────────────────────── */
    .menu-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--gray-50);
    }

    /* Search */
    .search-wrap {
      position: relative;
      padding: 12px 14px;
      background: #fff;
      border-bottom: 1px solid var(--gray-200);
      flex-shrink: 0;
    }
    .search-icon {
      position: absolute;
      left: 26px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--gray-400);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 9px 36px 9px 36px;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 13px;
      color: var(--gray-900);
      background: var(--gray-50);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      &::placeholder { color: var(--gray-400); }
      &:focus { border-color: #93C5FD; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); background: #fff; }
    }
    .search-clear {
      position: absolute;
      right: 26px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--gray-400);
      cursor: pointer;
      font-size: 12px;
      padding: 4px;
      &:hover { color: var(--gray-700); }
    }

    /* Promo banner */
    .promo-banner {
      margin: 12px 14px 0;
      padding: 9px 12px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #1E40AF;
      .promo-icon { font-size: 16px; }
    }

    /* Menu content */
    .menu-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Section */
    .menu-section { display: flex; flex-direction: column; gap: 10px; }
    .section-heading {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 700;
      color: var(--gray-500);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      .section-icon { font-size: 14px; }
      .section-count {
        background: var(--gray-200);
        color: var(--gray-500);
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 99px;
        margin-left: 2px;
      }
      .discount-tag { margin-left: 4px; }
    }

    /* Menu grid */
    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 8px;
    }

    /* Menu card */
    .menu-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 11px 12px;
      background: #fff;
      border: 1.5px solid var(--gray-200);
      border-radius: var(--radius);
      cursor: pointer;
      text-align: left;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
      font-family: inherit;

      &:hover { border-color: #93C5FD; box-shadow: var(--shadow-sm); }
      &:active { transform: scale(0.98); }

      &--cold:hover { border-color: #67E8F9; }

      &--active {
        border-color: var(--brand-red) !important;
        background: #FFF5F5;
        box-shadow: 0 0 0 3px rgba(214,40,40,0.08);
      }
    }
    .menu-card-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-900);
      line-height: 1.3;
    }
    .menu-card-footer {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .menu-card-price {
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-700);
      font-family: 'JetBrains Mono', monospace;
    }
    .menu-card-promo {
      font-size: 12px;
      font-weight: 700;
      color: var(--brand-teal);
      font-family: 'JetBrains Mono', monospace;
    }
    .menu-card-qty {
      margin-left: auto;
      font-size: 11px;
      font-weight: 700;
      color: var(--brand-red);
      background: var(--brand-red-light);
      padding: 1px 7px;
      border-radius: 99px;
    }

    /* ── Cart Panel ─────────────────────────────────────── */
    .cart-panel {
      display: flex;
      flex-direction: column;
      background: #fff;
      border-left: 1px solid var(--gray-200);
      overflow: hidden;
    }

    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--gray-100);
      flex-shrink: 0;
    }
    .cart-title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-900);
      svg { color: var(--gray-400); }
    }
    .cart-count {
      background: var(--brand-red);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 99px;
      min-width: 18px;
      text-align: center;
    }

    .cart-empty {
      flex: 1;
      justify-content: center;
    }

    /* Cart lines */
    .cart-lines {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .cart-line {
      padding: 10px 12px;
      background: var(--gray-50);
      border: 1px solid var(--gray-100);
      border-radius: var(--radius-sm);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .cart-line-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .cart-line-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-900);
      line-height: 1.3;
    }
    .cart-line-total {
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-900);
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
    }
    .cart-line-discounts {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .cart-line-pricing {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      .price-was { color: var(--gray-400); text-decoration: line-through; }
      svg { color: var(--gray-400); }
      .price-now { color: #059669; font-weight: 600; }
    }
    .cart-line-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 2px;
    }
    .qty-controls {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .qty-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: #fff;
      border: none;
      cursor: pointer;
      color: var(--gray-600);
      transition: background 0.1s;
      &:hover { background: var(--gray-100); }
      &:active { background: var(--gray-200); }
    }
    .qty-value {
      width: 30px;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-900);
      border-left: 1px solid var(--gray-200);
      border-right: 1px solid var(--gray-200);
      line-height: 28px;
    }
    .remove-btn {
      margin-left: auto;
      color: var(--gray-400) !important;
      &:hover { color: var(--brand-red) !important; border-color: #FECACA !important; }
    }

    /* Cart footer */
    .cart-footer {
      padding: 14px;
      border-top: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-shrink: 0;
      background: #fff;
    }

    .order-summary {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--gray-500);
    }
    .summary-total {
      font-size: 18px;
      font-weight: 800;
      color: var(--gray-900);
      padding-top: 6px;
      border-top: 1px solid var(--gray-100);
      span:last-child { font-family: 'JetBrains Mono', monospace; }
    }
  `],
})
export class CashierComponent implements OnInit, OnDestroy {
  allItems:   MenuItem[] = [];
  cartLines:  CartLine[] = [];
  cartTotal   = 0;
  searchTerm  = '';
  menuLoading = true;
  menuError   = false;
  submitting  = false;
  successMsg  = '';
  errorMsg    = '';

  private sub!: Subscription;

  constructor(public cart: CartService, private api: ApiService) {}

  ngOnInit(): void {
    this.loadMenu();
    this.sub = this.cart.lines$.subscribe(lines => {
      this.cartLines = lines;
      this.cartTotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  loadMenu(): void {
    this.menuLoading = true;
    this.menuError   = false;
    this.api.getMenu().subscribe({
      next:  items => { this.allItems = items; this.menuLoading = false; },
      error: ()    => { this.menuError = true;  this.menuLoading = false; },
    });
  }

  get hotItems(): MenuItem[] {
    return this.allItems.filter(i =>
      i.category === 'HotFood' &&
      i.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get coldItems(): MenuItem[] {
    return this.allItems.filter(i =>
      i.category === 'ColdDrink' &&
      i.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  /** True when it's a weekday before noon (local time) — shows half-price cold drink indicator */
  get isMorningDrinkDiscount(): boolean {
    const now = new Date();
    return now.getDay() >= 1 && now.getDay() <= 5 && now.getHours() < 12;
  }

  getCartQty(id: number): number {
    return this.cart.getLine(id)?.quantity ?? 0;
  }

  addItem(item: MenuItem): void {
    this.cart.addItem(item);
  }

  increment(line: CartLine): void {
    this.cart.setQuantity(line.menuItem, line.quantity + 1);
  }

  decrement(line: CartLine): void {
    this.cart.setQuantity(line.menuItem, line.quantity - 1);
  }

  submitOrder(): void {
    if (this.cart.isEmpty || this.submitting) return;

    this.submitting = true;
    this.successMsg = '';
    this.errorMsg   = '';

    const payload = {
      items: this.cartLines.map(l => ({
        menuItemId: l.menuItem.id,
        quantity:   l.quantity,
      })),
    };

    this.api.placeOrder(payload).subscribe({
      next: order => {
        this.submitting = false;
        this.cart.clear();
        this.successMsg = `✓ Order #${order.orderNumber} sent to kitchen!`;
        setTimeout(() => (this.successMsg = ''), 4000);
      },
      error: err => {
        this.submitting = false;
        this.errorMsg = err.error?.error ?? 'Failed to place order. Please try again.';
        setTimeout(() => (this.errorMsg = ''), 5000);
      },
    });
  }
}
