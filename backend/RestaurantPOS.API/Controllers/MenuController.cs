using Microsoft.AspNetCore.Mvc;
using RestaurantPOS.API.Domain;
using RestaurantPOS.API.Models;
using RestaurantPOS.API.Services;

namespace RestaurantPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController : ControllerBase
{
    private readonly DataStore _store;
    private readonly PricingService _pricing;

    public MenuController(DataStore store, PricingService pricing)
    {
        _store = store;
        _pricing = pricing;
    }

    /// <summary>GET all available menu items grouped by category</summary>
    [HttpGet]
    public IActionResult GetMenu()
    {
        var items = _store.Menu.Where(m => m.IsAvailable).ToList();
        return Ok(items);
    }

    /// <summary>
    /// Live price preview — cashier sends current cart line and gets back
    /// the discounted price. Called client-side on every quantity change
    /// so the running total is always accurate without client-side math.
    /// </summary>
    [HttpPost("preview-price")]
    public IActionResult PreviewPrice([FromBody] PricePreviewRequest req)
    {
        var item = _store.Menu.FirstOrDefault(m => m.Id == req.MenuItemId && m.IsAvailable);
        if (item == null) return NotFound(new ErrorResponse { Error = "Item not found" });

        var now = DateTime.UtcNow;
        var effectivePrice = _pricing.CalculateUnitPrice(item, req.Quantity, now);
        var discounts = BuildDiscountDescriptions(item, req.Quantity, now);

        return Ok(new PricePreviewResponse
        {
            MenuItemId = item.Id,
            Name = item.Name,
            BasePrice = item.BasePrice,
            EffectiveUnitPrice = effectivePrice,
            Quantity = req.Quantity,
            LineTotal = effectivePrice * req.Quantity,
            AppliedDiscounts = discounts
        });
    }

    private List<string> BuildDiscountDescriptions(Domain.MenuItem item, int qty, DateTime time)
    {
        var discounts = new List<string>();
        if (qty >= 3) discounts.Add("10% bulk discount (3+ of same item)");
        if (item.Category == Category.ColdDrink &&
            time.DayOfWeek is >= DayOfWeek.Monday and <= DayOfWeek.Friday &&
            time.Hour < 12)
            discounts.Add("50% weekday morning cold drink special");
        return discounts;
    }
}
