using RestaurantPOS.API.Domain;

namespace RestaurantPOS.API.Services;

/// <summary>
/// Single in-memory data store registered as a singleton.
/// All menu items and orders live here for the lifetime of the process.
///
/// ── TO ADD / EDIT MENU ITEMS ──────────────────────────────────────────
///   Edit the Menu list below. Each item needs:
///     Id          — unique integer (keep incrementing)
///     Name        — display name shown on cashier screen
///     BasePrice   — price BEFORE any discounts (decimal, e.g. 5.99m)
///     Category    — Category.HotFood  OR  Category.ColdDrink
///     IsAvailable — true = visible on cashier; false = hidden (out of stock)
///
/// ── TO ADD DUMMY ORDERS ───────────────────────────────────────────────
///   Edit the SeedOrders() method below. Orders go straight into the
///   Orders list so the kitchen display has data on first launch.
///   Statuses: Pending → Preparing → Ready → Completed
/// </summary>
public class DataStore
{
    private int _orderCounter = 100;

    // ── MENU ──────────────────────────────────────────────────────────
    public List<MenuItem> Menu { get; } = new()
    {
        // ── Hot Food ──────────────────────────────────────────────────
        new() { Id = 1,  Name = "Classic Beef Burger",    BasePrice = 850m,   Category = Category.HotFood,  IsAvailable = true },
        new() { Id = 2,  Name = "Double Smash Burger",    BasePrice = 1100m,  Category = Category.HotFood,  IsAvailable = true },
        new() { Id = 3,  Name = "BBQ Bacon Burger",       BasePrice = 1250m,  Category = Category.HotFood,  IsAvailable = true },
        new() { Id = 4,  Name = "Crispy Chicken Burger",  BasePrice = 950m,   Category = Category.HotFood,  IsAvailable = true },
        new() { Id = 17, Name = "Mozzarella Sticks",      BasePrice = 500m,   Category = Category.HotFood,  IsAvailable = false }, 

        // ── Cold Drinks ────────────────────────────────────────────────
        new() { Id = 18, Name = "Pepsi (Regular)",        BasePrice = 150m,   Category = Category.ColdDrink, IsAvailable = true },
        new() { Id = 19, Name = "7UP",                    BasePrice = 150m,   Category = Category.ColdDrink, IsAvailable = true },
        new() { Id = 20, Name = "Mirinda Orange",         BasePrice = 150m,   Category = Category.ColdDrink, IsAvailable = true },
        new() { Id = 21, Name = "Mountain Dew",           BasePrice = 150m,   Category = Category.ColdDrink, IsAvailable = true },
    };

    // ── ORDERS (pre-seeded for demo) ──────────────────────────────────
    public List<Order> Orders { get; }

    public DataStore()
    {
        Orders = SeedOrders();
    }

    public int NextOrderNumber() => Interlocked.Increment(ref _orderCounter);

    /// <summary>
    /// Pre-seeded dummy orders so the kitchen display is not empty on first launch.
    /// One order in each active status so testers can immediately see the workflow.
    /// </summary>
    private List<Order> SeedOrders()
    {
        var now = DateTime.UtcNow;

        return new List<Order>
        {
            // ── Order #101: PENDING (just arrived, kitchen hasn't touched it) ──
            new()
            {
                Id          = Guid.NewGuid(),
                OrderNumber = 101,
                Status      = OrderStatus.Pending,
                CreatedAt   = now.AddMinutes(-3),
                Items       = new()
                {
                    new() { MenuItemId = 1,  MenuItemName = "Classic Beef Burger",   Category = Category.HotFood,   Quantity = 2, UnitPrice = 850m,  DiscountedUnitPrice = 765m  },  // 10% bulk discount
                    new() { MenuItemId = 9,  MenuItemName = "Regular Fries",         Category = Category.HotFood,   Quantity = 2, UnitPrice = 250m,  DiscountedUnitPrice = 250m  },
                    new() { MenuItemId = 18, MenuItemName = "Pepsi (Regular)",       Category = Category.ColdDrink, Quantity = 2, UnitPrice = 150m,  DiscountedUnitPrice = 150m  },
                }
            },

            // ── Order #102: PREPARING (kitchen started working on it) ─────────
            new()
            {
                Id               = Guid.NewGuid(),
                OrderNumber      = 102,
                Status           = OrderStatus.Preparing,
                CreatedAt        = now.AddMinutes(-12),
                KitchenStartedAt = now.AddMinutes(-9),
                Items            = new()
                {
                    new() { MenuItemId = 4,  MenuItemName = "Crispy Chicken Burger",  Category = Category.HotFood,   Quantity = 1, UnitPrice = 950m,  DiscountedUnitPrice = 950m  },
                    new() { MenuItemId = 6,  MenuItemName = "Chicken Shawarma Wrap",  Category = Category.HotFood,   Quantity = 1, UnitPrice = 700m,  DiscountedUnitPrice = 700m  },
                    new() { MenuItemId = 10, MenuItemName = "Loaded Cheese Fries",    Category = Category.HotFood,   Quantity = 1, UnitPrice = 380m,  DiscountedUnitPrice = 380m  },
                    new() { MenuItemId = 25, MenuItemName = "Mango Shake",            Category = Category.ColdDrink, Quantity = 1, UnitPrice = 350m,  DiscountedUnitPrice = 350m  },
                }
            },

            // ── Order #103: READY (waiting for pickup at counter) ─────────────
            new()
            {
                Id               = Guid.NewGuid(),
                OrderNumber      = 103,
                Status           = OrderStatus.Ready,
                CreatedAt        = now.AddMinutes(-20),
                KitchenStartedAt = now.AddMinutes(-17),
                ReadyAt          = now.AddMinutes(-2),
                Items            = new()
                {
                    new() { MenuItemId = 3,  MenuItemName = "BBQ Bacon Burger",       Category = Category.HotFood,   Quantity = 3, UnitPrice = 1250m, DiscountedUnitPrice = 1125m }, // 10% bulk discount
                    new() { MenuItemId = 11, MenuItemName = "Masala Fries",           Category = Category.HotFood,   Quantity = 2, UnitPrice = 320m,  DiscountedUnitPrice = 320m  },
                    new() { MenuItemId = 26, MenuItemName = "Strawberry Shake",       Category = Category.ColdDrink, Quantity = 3, UnitPrice = 350m,  DiscountedUnitPrice = 315m  }, // 10% bulk discount
                }
            },

            // ── Order #104: Another PENDING (stress-tests the count badge) ────
            new()
            {
                Id          = Guid.NewGuid(),
                OrderNumber = 104,
                Status      = OrderStatus.Pending,
                CreatedAt   = now.AddMinutes(-1),
                Items       = new()
                {
                    new() { MenuItemId = 5,  MenuItemName = "Zinger Burger",          Category = Category.HotFood,   Quantity = 1, UnitPrice = 800m,  DiscountedUnitPrice = 800m  },
                    new() { MenuItemId = 19, MenuItemName = "7UP",                    Category = Category.ColdDrink, Quantity = 1, UnitPrice = 150m,  DiscountedUnitPrice = 150m  },
                }
            },
        };
    }
}
