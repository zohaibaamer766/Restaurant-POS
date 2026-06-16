import { Injectable, NgZone, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SignalrService implements OnDestroy {
  private hub!: signalR.HubConnection;
  private _ordersUpdated$ = new Subject<void>();

  /** Emits every time the backend broadcasts an order change */
  readonly ordersUpdated$ = this._ordersUpdated$.asObservable();

  isConnected = false;

  constructor(private zone: NgZone) {
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/pos')
      .withAutomaticReconnect([0, 1000, 2000, 5000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hub.onreconnected(() => { this.zone.run(() => { this.isConnected = true; }); });
    this.hub.onclose(()      => { this.zone.run(() => { this.isConnected = false; }); });

    this.hub.on('OrdersUpdated', () => {
      // Run inside Angular's zone so change detection fires
      this.zone.run(() => this._ordersUpdated$.next());
    });

    this.connect();
  }

  private connect(): void {
    this.hub.start()
      .then(() => { this.zone.run(() => { this.isConnected = true; }); })
      .catch(err => console.warn('SignalR initial connection failed:', err));
  }

  ngOnDestroy(): void {
    this.hub.stop();
  }
}
