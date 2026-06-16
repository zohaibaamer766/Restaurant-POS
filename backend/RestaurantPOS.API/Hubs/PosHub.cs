using Microsoft.AspNetCore.SignalR;

namespace RestaurantPOS.API.Hubs;

/// <summary>
/// Simple broadcast hub — whenever any order changes, all connected
/// clients receive an "OrdersUpdated" event and re-fetch active orders.
/// This keeps the cashier panel and kitchen display in sync without polling.
/// </summary>
public class PosHub : Hub { }
