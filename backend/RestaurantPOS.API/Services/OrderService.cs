using RestaurantPOS.API.Domain;
using RestaurantPOS.API.Models;

namespace RestaurantPOS.API.Services;

public class OrderService
{
    private readonly DataStore _store;
    private readonly PricingService _pricing;

    public OrderService(DataStore store, PricingService pricing)
    {
        _store = store;
        _pricing = pricing;
    }

    // ── Cashier ─────────────────────────────────────────────

    public Order PlaceOrder(PlaceOrderRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
            throw new ArgumentException("Order must contain at least one item.");

        var order = new Order
        {
            OrderNumber = _store.NextOrderNumber(),
            CreatedAt = DateTime.UtcNow
        };

        foreach (var lineReq in request.Items)
        {
            var menuItem = _store.Menu.FirstOrDefault(m => m.Id == lineReq.MenuItemId && m.IsAvailable)
                ?? throw new ArgumentException($"Menu item {lineReq.MenuItemId} not found or unavailable.");

            if (lineReq.Quantity < 1)
                throw new ArgumentException($"Quantity for item {menuItem.Name} must be at least 1.");

            var discountedPrice = _pricing.CalculateUnitPrice(menuItem, lineReq.Quantity, order.CreatedAt);

            order.Items.Add(new OrderItem
            {
                MenuItemId = menuItem.Id,
                MenuItemName = menuItem.Name,
                Category = menuItem.Category,
                Quantity = lineReq.Quantity,
                UnitPrice = menuItem.BasePrice,
                DiscountedUnitPrice = discountedPrice
            });
        }

        lock (_store.Orders)
            _store.Orders.Add(order);

        return order;
    }

    public bool CancelOrder(Guid orderId)
    {
        lock (_store.Orders)
        {
            var order = _store.Orders.FirstOrDefault(o => o.Id == orderId);
            if (order == null) return false;

            // Cashier can only cancel orders the kitchen has NOT yet touched
            if (order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Cannot cancel an order that is already being prepared.");

            _store.Orders.Remove(order);
            return true;
        }
    }

    // ── Kitchen ──────────────────────────────────────────────

    /// <summary>
    /// Advance an order to its next status. Steps are strictly sequential:
    /// Pending → Preparing → Ready → Completed
    /// No skipping, no reversals.
    /// </summary>
    public Order AdvanceStatus(Guid orderId)
    {
        lock (_store.Orders)
        {
            var order = _store.Orders.FirstOrDefault(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Order not found.");

            switch (order.Status)
            {
                case OrderStatus.Pending:
                    order.Status = OrderStatus.Preparing;
                    order.KitchenStartedAt = DateTime.UtcNow;
                    break;

                case OrderStatus.Preparing:
                    order.Status = OrderStatus.Ready;
                    order.ReadyAt = DateTime.UtcNow;
                    break;

                case OrderStatus.Ready:
                    order.Status = OrderStatus.Completed;
                    order.CompletedAt = DateTime.UtcNow;
                    break;

                case OrderStatus.Completed:
                    throw new InvalidOperationException("Order is already completed.");
            }

            return order;
        }
    }

    // ── Queries ──────────────────────────────────────────────

    public List<Order> GetActiveOrders()
    {
        lock (_store.Orders)
            return _store.Orders
                .Where(o => o.Status != OrderStatus.Completed)
                .OrderBy(o => o.CreatedAt)
                .ToList();
    }

    public List<Order> GetAllOrders()
    {
        lock (_store.Orders)
            return _store.Orders.OrderByDescending(o => o.CreatedAt).ToList();
    }

    public Order? GetOrder(Guid id)
    {
        lock (_store.Orders)
            return _store.Orders.FirstOrDefault(o => o.Id == id);
    }
}
