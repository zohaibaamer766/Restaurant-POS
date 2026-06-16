import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MenuItem,
  Order,
  PlaceOrderRequest,
  PricePreviewRequest,
  PricePreviewResponse,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  // ── Menu ──────────────────────────────────────────────────
  getMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.base}/menu`);
  }

  previewPrice(req: PricePreviewRequest): Observable<PricePreviewResponse> {
    return this.http.post<PricePreviewResponse>(`${this.base}/menu/preview-price`, req);
  }

  // ── Orders ────────────────────────────────────────────────
  placeOrder(req: PlaceOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders`, req);
  }

  cancelOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/orders/${id}`);
  }

  getActiveOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders/active`);
  }

  getOrderHistory(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders/history`);
  }

  advanceOrder(id: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${id}/advance`, {});
  }
}
