// ── Enums (match C# backend exactly) ─────────────────────────
export type Category    = 'HotFood' | 'ColdDrink';
export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed';

// ── Backend API shapes ────────────────────────────────────────
export interface MenuItem {
  id:          number;
  name:        string;
  basePrice:   number;
  category:    Category;
  isAvailable: boolean;
}

export interface OrderItem {
  menuItemId:          number;
  menuItemName:        string;
  category:            Category;
  quantity:            number;
  unitPrice:           number;   // base price at time of order
  discountedUnitPrice: number;   // after pricing rules
  lineTotal:           number;
}

export interface Order {
  id:               string;
  orderNumber:      number;
  items:            OrderItem[];
  total:            number;
  status:           OrderStatus;
  createdAt:        string;
  kitchenStartedAt: string | null;
  readyAt:          string | null;
  completedAt:      string | null;
}

// ── Request DTOs ──────────────────────────────────────────────
export interface PlaceOrderRequest {
  items: { menuItemId: number; quantity: number }[];
}

export interface PricePreviewRequest {
  menuItemId: number;
  quantity:   number;
}

export interface PricePreviewResponse {
  menuItemId:         number;
  name:               string;
  basePrice:          number;
  effectiveUnitPrice: number;
  quantity:           number;
  lineTotal:          number;
  appliedDiscounts:   string[];
}

// ── Local cart model ──────────────────────────────────────────
export interface CartLine {
  menuItem:          MenuItem;
  quantity:          number;
  effectiveUnitPrice: number;
  lineTotal:         number;
  appliedDiscounts:  string[];
}
