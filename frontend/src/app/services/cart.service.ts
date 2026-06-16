import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartLine, MenuItem } from '../models/models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _lines$ = new BehaviorSubject<CartLine[]>([]);

  readonly lines$ = this._lines$.asObservable();

  constructor(private api: ApiService) {}

  // ── Reads ───────────────────────────────────────────────────
  get lines(): CartLine[] { return this._lines$.getValue(); }
  get isEmpty(): boolean  { return this.lines.length === 0; }
  get total(): number     { return this.lines.reduce((s, l) => s + l.lineTotal, 0); }
  get itemCount(): number { return this.lines.reduce((s, l) => s + l.quantity, 0); }

  getLine(menuItemId: number): CartLine | undefined {
    return this.lines.find(l => l.menuItem.id === menuItemId);
  }

  // ── Mutations ────────────────────────────────────────────────
  addItem(item: MenuItem): void {
    const existing = this.getLine(item.id);
    this.updateFromServer(item, (existing?.quantity ?? 0) + 1);
  }

  setQuantity(item: MenuItem, qty: number): void {
    if (qty <= 0) { this.remove(item.id); return; }
    this.updateFromServer(item, qty);
  }

  remove(menuItemId: number): void {
    this._lines$.next(this.lines.filter(l => l.menuItem.id !== menuItemId));
  }

  clear(): void {
    this._lines$.next([]);
  }

  // ── Server price fetch ───────────────────────────────────────
  /**
   * Always ask the server for the effective price — never calculate client-side.
   * This ensures discounts (bulk 10%, weekday-morning drinks 50%) are always
   * reflected accurately in the cart display.
   */
  private updateFromServer(item: MenuItem, qty: number): void {
    this.api.previewPrice({ menuItemId: item.id, quantity: qty }).subscribe({
      next: preview => {
        const rest = this.lines.filter(l => l.menuItem.id !== item.id);
        this._lines$.next([
          ...rest,
          {
            menuItem:           item,
            quantity:           preview.quantity,
            effectiveUnitPrice: preview.effectiveUnitPrice,
            lineTotal:          preview.lineTotal,
            appliedDiscounts:   preview.appliedDiscounts,
          },
        ]);
      },
      error: err => console.error('Price preview failed:', err),
    });
  }
}
