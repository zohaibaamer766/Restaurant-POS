import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SignalrService } from './services/signalr.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <header class="app-header">
      <div class="header-left">
        <div class="brand">
          <span class="brand-logo">🍔</span>
          <div class="brand-text">
            <span class="brand-name">QuickServe</span>
            <span class="brand-sub">Point of Sale</span>
          </div>
        </div>
      </div>

      <nav class="header-nav">
        <a routerLink="/"        routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          POS Terminal
        </a>
        <a routerLink="/history" routerLinkActive="active" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
          Order History
        </a>
      </nav>

      <!--<div class="header-right">
        <div class="live-indicator" [class.connected]="signalr.isConnected">
          <span class="live-dot" *ngIf="signalr.isConnected"></span>
          <span class="live-ring" *ngIf="!signalr.isConnected">○</span>
          <span class="live-label">{{ signalr.isConnected ? 'Live' : 'Offline' }}</span>
        </div>
        <div class="header-time">{{ now | date:'HH:mm' }}</div>
      </div>-->
    </header>

    <main class="app-main">
      <router-outlet />
    </main>
  `,
  styles: [`
    .app-header {
      height: var(--header-h);
      background: var(--brand-navy);
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 200;
      box-shadow: 0 2px 12px rgba(0,0,0,0.25);
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .brand-logo {
      font-size: 24px;
      line-height: 1;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 16px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 500;
      color: rgba(255,255,255,0.45);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    /* Nav */
    .header-nav {
      display: flex;
      gap: 2px;
      margin-left: 28px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      color: rgba(255,255,255,0.55);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: color 0.15s, background 0.15s;

      svg { opacity: 0.7; transition: opacity 0.15s; }
      &:hover { color: #fff; background: rgba(255,255,255,0.08); svg { opacity: 1; } }
      &.active { color: #fff; background: rgba(255,255,255,0.12); svg { opacity: 1; } }
    }

    /* Right side */
    .header-left  { flex-shrink: 0; }
    .header-right { margin-left: auto; display: flex; align-items: center; gap: 16px; }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 99px;
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.4);

      &.connected {
        color: #34D399;
        border-color: rgba(52,211,153,0.2);
        background: rgba(52,211,153,0.08);
      }
    }
    .live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #34D399;
      box-shadow: 0 0 0 0 rgba(52,211,153,0.4);
      animation: ping 1.4s ease-out infinite;
    }
    @keyframes ping {
      0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
      100% { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
    }
    .live-ring { font-size: 9px; }
    .live-label { letter-spacing: 0.04em; text-transform: uppercase; }

    .header-time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      color: rgba(255,255,255,0.5);
      letter-spacing: 0.05em;
    }

    .app-main { height: calc(100vh - var(--header-h)); overflow: hidden; }
  `],
})
export class AppComponent {
  now = new Date();

  constructor(public signalr: SignalrService) {
    // Update clock every 30s
    setInterval(() => { this.now = new Date(); }, 30_000);
  }
}
