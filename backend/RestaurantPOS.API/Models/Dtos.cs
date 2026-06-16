namespace RestaurantPOS.API.Models;

public class PlaceOrderRequest
{
    public List<OrderLineRequest> Items { get; set; } = new();
}

public class OrderLineRequest
{
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
}

// Used by cashier to preview price before submitting
public class PricePreviewRequest
{
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
}

public class PricePreviewResponse
{
    public int MenuItemId { get; set; }
    public string Name { get; set; } = "";
    public decimal BasePrice { get; set; }
    public decimal EffectiveUnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
    public List<string> AppliedDiscounts { get; set; } = new();
}

public class ErrorResponse
{
    public string Error { get; set; } = "";
}
