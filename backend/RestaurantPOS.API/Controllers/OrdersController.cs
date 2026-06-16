using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantPOS.API.Hubs;
using RestaurantPOS.API.Models;
using RestaurantPOS.API.Services;

namespace RestaurantPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly OrderService _orders;
    private readonly IHubContext<PosHub> _hub;

    public OrdersController(OrderService orders, IHubContext<PosHub> hub)
    {
        _orders = orders;
        _hub = hub;
    }

    // ── Cashier endpoints ─────────────────────────────────────

    /// <summary>Place a new order. Server recalculates all prices — client prices are ignored.</summary>
    [HttpPost]
    public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request)
    {
        try
        {
            var order = _orders.PlaceOrder(request);
            await _hub.Clients.All.SendAsync("OrdersUpdated");
            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse { Error = ex.Message });
        }
    }

    /// <summary>Cancel a pending (kitchen-untouched) order.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelOrder(Guid id)
    {
        try
        {
            var removed = _orders.CancelOrder(id);
            if (!removed) return NotFound(new ErrorResponse { Error = "Order not found." });
            await _hub.Clients.All.SendAsync("OrdersUpdated");
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ErrorResponse { Error = ex.Message });
        }
    }

    // ── Kitchen endpoints ─────────────────────────────────────

    /// <summary>Active orders for the kitchen display (excludes completed).</summary>
    [HttpGet("active")]
    public IActionResult GetActiveOrders() => Ok(_orders.GetActiveOrders());

    /// <summary>Full order history including completed orders.</summary>
    [HttpGet("history")]
    public IActionResult GetHistory() => Ok(_orders.GetAllOrders());

    [HttpGet("{id:guid}")]
    public IActionResult GetOrder(Guid id)
    {
        var order = _orders.GetOrder(id);
        return order is null ? NotFound() : Ok(order);
    }

    /// <summary>
    /// Advance an order's status by one step.
    /// Pending → Preparing → Ready → Completed
    /// Cannot skip or reverse.
    /// </summary>
    [HttpPatch("{id:guid}/advance")]
    public async Task<IActionResult> Advance(Guid id)
    {
        try
        {
            var order = _orders.AdvanceStatus(id);
            await _hub.Clients.All.SendAsync("OrdersUpdated");
            return Ok(order);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse { Error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ErrorResponse { Error = ex.Message });
        }
    }
}
