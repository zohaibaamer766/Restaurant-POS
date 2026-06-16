namespace RestaurantPOS.API.Domain;

public enum Category { HotFood, ColdDrink }

public enum OrderStatus
{
    Pending,    // Just submitted by cashier, kitchen hasn't touched it
    Preparing,  // Kitchen started working on it
    Ready,      // Kitchen marked it ready for pickup
    Completed   // Picked up / done
}

public class MenuItem
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal BasePrice { get; set; }
    public Category Category { get; set; }
    public bool IsAvailable { get; set; } = true;
}

public class OrderItem
{
    public int MenuItemId { get; set; }
    public string MenuItemName { get; set; } = "";
    public Category Category { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }       // base price at time of order
    public decimal DiscountedUnitPrice { get; set; } // after pricing rules
    public decimal LineTotal => DiscountedUnitPrice * Quantity;
}

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int OrderNumber { get; set; }
    public List<OrderItem> Items { get; set; } = new();
    public decimal Total => Items.Sum(i => i.LineTotal);
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? KitchenStartedAt { get; set; }
    public DateTime? ReadyAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
