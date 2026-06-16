using RestaurantPOS.API.Domain;

namespace RestaurantPOS.API.Services;

/// <summary>
/// All pricing logic lives here. The API always recalculates — the client
/// never submits prices; it only submits item IDs and quantities.
/// </summary>
public class PricingService
{
    /// <summary>
    /// Calculate the effective unit price for a menu item given a quantity
    /// and the time the order is being placed.
    /// 
    /// Rules:
    ///   1. Bulk discount: qty >= 3 of same item → 10% off that item's base price
    ///   2. Happy-hour drinks: weekday (Mon-Fri) before noon UTC → cold drinks are 50% off
    ///
    /// Both rules can stack if a customer orders 3+ cold drinks before noon on a weekday.
    /// Decision: stack the discounts multiplicatively (10% off then 50% off), which is the
    /// most customer-friendly interpretation and simplest to implement.
    /// </summary>
    public decimal CalculateUnitPrice(MenuItem item, int quantity, DateTime? orderTime = null)
    {
        var time = orderTime ?? DateTime.UtcNow;
        var price = item.BasePrice;

        // Rule 1 — bulk discount
        if (quantity >= 3)
            price *= 0.90m;

        // Rule 2 — weekday morning cold drinks
        if (item.Category == Category.ColdDrink && IsWeekdayMorning(time))
            price *= 0.50m;

        return Math.Round(price, 2);
    }

    private static bool IsWeekdayMorning(DateTime utcTime)
    {
        return utcTime.DayOfWeek is >= DayOfWeek.Monday and <= DayOfWeek.Friday
               && utcTime.Hour < 12;
    }
}
