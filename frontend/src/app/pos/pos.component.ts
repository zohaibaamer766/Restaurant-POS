import { Component } from '@angular/core';
import { CashierComponent } from '../cashier/cashier.component';
import { KitchenComponent } from '../kitchen/kitchen.component';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CashierComponent, KitchenComponent],
  template: `
    <div class="pos-layout">

      <!-- LEFT: Cashier Panel -->
      <div class="pos-panel cashier-side">
        <div class="panel-label cashier-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
          Cashier Station
        </div>
        <app-cashier />
      </div>

      <!-- DIVIDER -->
      <div class="pos-divider"></div>

      <!-- RIGHT: Kitchen Panel -->
      <div class="pos-panel kitchen-side">
        <div class="panel-label kitchen-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 2v20M18 2v20M6 12h12"/>
          </svg>
          Kitchen Display
        </div>
        <app-kitchen />
      </div>

    </div>
  `,
  styles: [`
    .pos-layout {
      display: grid;
      grid-template-columns: 1fr 1px 1fr;
      height: 100%;
      overflow: hidden;
      background: var(--gray-100);
    }

    .pos-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .panel-label {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 18px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      flex-shrink: 0;
      svg { opacity: 0.8; }
    }

    .cashier-label {
      background: #EFF6FF;
      color: #1E40AF;
      border-bottom: 1px solid #DBEAFE;
    }

    .kitchen-label {
      background: #FFF7ED;
      color: #C2410C;
      border-bottom: 1px solid #FED7AA;
    }

    .pos-divider {
      background: var(--gray-200);
      width: 1px;
    }
  `],
})
export class PosComponent {}
