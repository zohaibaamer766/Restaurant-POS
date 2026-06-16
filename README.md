<<<<<<< HEAD
# Restaurant POS — Quick-Service Order & Kitchen Workflow System

A full-stack web application built for Solvefy's ASP.NET Core & Angular developer test task.

---

## Getting Started

### Option A — Docker (recommended, single command)

```bash
docker compose up --build
```

- Frontend: http://localhost:4200
- Backend API + Swagger: http://localhost:5000/swagger

### Option B — Local development
=======
# Restaurant POS — Quick-Service Order & Kitchen Workflow

Built for Solvefy's ASP.NET Core & Angular test task.

---

## Running the Project
>>>>>>> 9ae8ad380da8f057cb5719e68441f0311d8f92fe

**Backend**
```bash
cd backend/RestaurantPOS.API
dotnet run
<<<<<<< HEAD
# API on http://localhost:5000, Swagger at http://localhost:5000/swagger
=======
# http://localhost:5000/swagger
>>>>>>> 9ae8ad380da8f057cb5719e68441f0311d8f92fe
```

**Frontend**
```bash
cd frontend
npm install
npm start
<<<<<<< HEAD
# Angular dev server on http://localhost:4200
```

**Tests**
```bash
cd backend
dotnet test
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core 8, C# |
| Storage | In-memory (singleton `DataStore`) |
| Real-time | SignalR |
| API Docs | Swagger / OpenAPI |
| Frontend | Angular 18 (standalone components) |
| Styling | SCSS with CSS custom properties |
| Container | Docker + Docker Compose |

=======
# http://localhost:4200
```

>>>>>>> 9ae8ad380da8f057cb5719e68441f0311d8f92fe
---

## Architecture

<<<<<<< HEAD
### Backend Structure

```
RestaurantPOS.API/
├── Domain/
│   └── Models.cs          # MenuItem, Order, OrderItem, OrderStatus enum
├── Services/
│   ├── DataStore.cs       # Singleton in-memory store + menu seeding
│   ├── PricingService.cs  # All pricing rules — single source of truth
│   └── OrderService.cs    # Order lifecycle + workflow enforcement
├── Controllers/
│   ├── MenuController.cs  # GET /api/menu, POST /api/menu/preview-price
│   └── OrdersController.cs # CRUD + PATCH /advance + cancel
├── Hubs/
│   └── PosHub.cs          # SignalR hub — broadcasts "OrdersUpdated"
└── Program.cs             # DI registration, CORS, SignalR, Swagger
```

**How the layers interact:**

1. `DataStore` (singleton) holds the seeded menu and all live orders.
2. `PricingService` (stateless) computes effective unit prices given an item, quantity, and timestamp.
3. `OrderService` uses both — it calls `PricingService` during `PlaceOrder` and enforces the status state machine in `AdvanceStatus`.
4. Controllers are thin: validate inputs, call `OrderService`, broadcast via `IHubContext<PosHub>`, return results.

### Frontend Structure

```
src/app/
├── models/models.ts         # TypeScript interfaces mirroring backend DTOs
├── services/
│   ├── api.service.ts       # All HTTP calls
│   ├── cart.service.ts      # BehaviorSubject cart state; calls server for prices
│   └── signalr.service.ts   # SignalR connection; exposes ordersUpdated$ Observable
├── pos/pos.component.ts     # Split-panel layout (cashier left, kitchen right)
├── cashier/cashier.component.ts  # Menu grid + cart + order submission
├── kitchen/kitchen.component.ts  # Live order display + status advancement
├── history/history.component.ts  # Completed order log with timestamps
└── app.component.ts         # Top nav + router outlet
```

---

## Design Decisions

### Decision I thought hard about — Where does price calculation live?

**The requirement:** "The price shown to the cashier and charged to the customer must always be calculated by the system — the client must not be able to submit a total and have the system accept it."

**Alternatives I considered:**

*Option A — Client calculates, server trusts it.* Fast and simple. Completely wrong for this requirement — a modified client could submit any total.

*Option B — Client calculates for display, server recalculates on submission.* The most common real-world pattern. The problem: the cashier sees a price, the server recalculates and might disagree. If they differ (e.g. a discount window expires between "add to cart" and "submit"), the cashier is showing stale information.

*Option C — Server is the only price calculator; client calls a preview endpoint on every quantity change.* This is what I built. The client never does arithmetic on prices — it just sends `(menuItemId, quantity)` to `POST /api/menu/preview-price` and gets back the authoritative effective price. The cart's running total is always what the server would charge.

**Why I chose C:** The requirement explicitly prohibits client-submitted totals, and option B still creates a brief window of price disagreement. Option C adds a network call per quantity change, which is acceptable on a LAN (this is a counter device, not a mobile app) and means the display is always true.

---

### Something harder than it looked — The bulk discount + order submission tension

At first glance, the 10% bulk discount looks simple: `if (qty >= 3) price *= 0.90`. The complexity emerged when I modelled the cart.

If a customer adds 2 burgers and then later adds a 3rd, the price of the *first two* should retroactively drop. The discount applies to the line, not just the "extra" item. This means every quantity change for an item needs to recalculate that item's effective unit price — not just the marginal unit.

My solution: `CartService.setQuantity()` always calls the preview endpoint for the *full new quantity*, not an incremental delta. This means the server always sees the complete line and applies the rule correctly. The cart replaces the existing line entry entirely rather than patching it.

The secondary complexity: a cart line in Angular therefore needs to be treated as **immutable** — replace, never mutate — so Angular's change detection (`async` pipe on the `BehaviorSubject`) fires correctly and the template re-renders.

---

### Frontend State — How the panels stay in sync

**Where shared data lives:** The kitchen display owns its own `orders: Order[]` array (local component state). The cashier has its own `CartService` (a BehaviorSubject of cart lines). There is no single global orders store — the kitchen simply re-fetches from the server whenever told to.

**How they stay in sync:**

```
Cashier places order
       ↓
POST /api/orders  →  OrderService.PlaceOrder()
       ↓
IHubContext<PosHub>.Clients.All.SendAsync("OrdersUpdated")
       ↓
SignalR broadcasts to all connected browser tabs
       ↓
SignalrService.ordersUpdated$ emits in every client
       ↓
KitchenComponent subscribes → calls loadOrders() → GET /api/orders/active
       ↓
Kitchen display updates
```

The same broadcast happens on `PATCH /advance` and `DELETE /:id`. The pattern is: **mutate on server → broadcast event → clients re-fetch**. This is "invalidation" rather than "push the diff", which keeps the logic simple and avoids stale patch application ordering issues.

The cashier panel does not subscribe to `ordersUpdated$` because it doesn't display orders — it only displays the menu (static) and the cart (local state). This keeps the components loosely coupled.

---

## Pricing Rules Summary

| Rule | Condition | Effect |
|---|---|---|
| Bulk discount | Same item, qty ≥ 3 | −10% off unit price |
| Morning drinks | Cold drink, weekday (Mon–Fri), before 12:00 UTC | −50% off unit price |
| Stacked | Both conditions met | Applied multiplicatively: `base × 0.90 × 0.50` |

Prices are always calculated server-side. The `preview-price` endpoint lets the UI display live accurate prices without doing any arithmetic itself.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/menu` | All available menu items |
| `POST` | `/api/menu/preview-price` | Authoritative price for a line item |
| `POST` | `/api/orders` | Place a new order |
| `GET` | `/api/orders/active` | Orders not yet completed (kitchen display) |
| `GET` | `/api/orders/history` | All orders including completed |
| `GET` | `/api/orders/{id}` | Single order by ID |
| `PATCH` | `/api/orders/{id}/advance` | Advance status one step |
| `DELETE` | `/api/orders/{id}` | Cancel (only if still Pending) |
| WS | `/hubs/pos` | SignalR hub |

Full interactive docs at `http://localhost:5000/swagger` when running locally.

---

## Order Status Workflow

```
[Cashier submits]
       ↓
   PENDING  ──(cashier cancel)──► [removed]
       ↓  ← kitchen presses "Start Preparing"
  PREPARING
       ↓  ← kitchen presses "Mark Ready"
    READY
       ↓  ← kitchen presses "Complete"
  COMPLETED  ──► moves to history, off active display
```

Rules enforced by the server:
- Steps are strictly sequential — no skipping.
- No reversal once a step is taken.
- Cancellation is only possible in `Pending` state (kitchen has not touched it).

---

## What I Would Do Next (with 2 more hours)

**Priority 1 — Order timestamps + elapsed time on kitchen cards.**
The kitchen card currently shows when an order was placed and when it was started, but not a live "time since start" counter. A kitchen worker's most important signal is "this has been sitting for 8 minutes." A simple `setInterval` updating a displayed duration would add real operational value with ~30 minutes of work.

**Priority 2 — Optimistic UI on status advance.**
Currently the kitchen card waits for the server response before updating. With a known sequential state machine this is safe to optimistic-update immediately and roll back on error, which would feel snappier.

**Priority 3 — Toast notifications instead of `confirm()` dialogs.**
The cancel confirmation uses the browser's native `confirm()`. A proper dismissible toast component would be more professional and non-blocking.

---

## Scaling and Deployment Considerations

**What breaks first at multiple instances:**

The `DataStore` is a .NET singleton that lives in a single process's heap. The moment you run a second container instance:
- Instance A processes "place order" → its `DataStore` has the order
- Instance B handles "get active orders" → its `DataStore` is empty
- The kitchen display, routed to B by the load balancer, sees nothing

**How to fix shared state:**
Replace `DataStore` with a real database. Since no foreign-key joins are needed for the query patterns here (the "active orders" query is just a filter + sort), Redis would work well as a fast in-memory store that survives process restarts and is shared across all instances. For full durability (order history), PostgreSQL or SQL Server with EF Core Code First is the right move.

**How to fix SignalR across instances:**
SignalR's in-process backplane only broadcasts to clients connected to the *same* instance. Fix: use **Azure SignalR Service** (managed) or the **Redis backplane** (`AddStackExchangeRedis` on `AddSignalR`). Either routes all broadcasts through a shared broker so every instance's clients receive the event.

**Containerization (already done):**
Both services have Dockerfiles. `docker compose up --build` runs the full system locally. For cloud deployment:
- Push images to a container registry (ECR, ACR, Docker Hub)
- Deploy backend and frontend as separate services (ECS, AKS, Cloud Run, etc.)
- Add a Redis instance to the infrastructure
- Configure environment variables for connection strings
- Put a load balancer in front of backend instances with sticky sessions enabled for SignalR (or use the Azure SignalR Service which doesn't need sticky sessions)
=======
The backend is split into three layers. `DataStore` holds everything in memory. `PricingService` handles all discount calculations. `OrderService` manages order lifecycle and enforces the status workflow. Controllers are thin — they call a service, and return the result.

The frontend has two panels on one page — cashier on the left, kitchen on the right. `CartService` holds cart state as a `BehaviorSubject`. `ApiService` handles all HTTP calls.

---

## A Decision I Made

**Who calculates prices.**

The requirement said the client should never submit a total the server just accepts. I could have calculated prices on the client for display and then recalculated on the server at submission — but that creates a window where the cashier sees one price and the server charges another (e.g. if the morning discount expires mid-session).

Instead I added a `preview-price` endpoint. Every time a quantity changes in the cart, the frontend calls it and gets back the real price. The cart never does any math itself. What the cashier sees is exactly what gets charged.

---

## Something Harder Than It Looked

The bulk discount (10% off when qty ≥ 3) sounds simple but the cart made it tricky. When a cashier adds a 3rd burger, the first two also need to drop in price — it's not just the new item that gets discounted.

This meant I couldn't just append a new line with a different price. Every quantity change has to replace the whole cart line with a fresh server response for the full quantity. It also meant using replace-not-mutate on the array so Angular's change detection actually fires.

---

## Frontend State

The two panels don't share an orders store. Instead:

1. Cashier places order → `POST /api/orders`
2. Server saves it, then broadcasts `OrdersUpdated` via SignalR
3. Kitchen panel receives the event → calls `GET /api/orders/active`
4. Display updates

Same flow on every status advance or cancel. The server is always the source of truth — the kitchen just re-fetches when told something changed.

---

## What I'd Do Next

Add a live "X minutes ago" timer on kitchen order cards. Right now you can see when an order was placed but not how long it's been waiting. That's the most useful signal for kitchen staff and it's a small change.

---

## Scaling

Right now everything lives in one process. If you ran two backend instances, each would have its own `DataStore` and its own SignalR connections — they'd be completely out of sync.

The fix is two things: move orders to a shared database (Redis or PostgreSQL), and add the Redis backplane for SignalR so broadcasts reach clients on all instances. The Dockerfiles are already written — deploying to something like ECS or AKS would mainly just need those two infrastructure pieces added.
>>>>>>> 9ae8ad380da8f057cb5719e68441f0311d8f92fe

---

## AI Usage

<<<<<<< HEAD
**What I used AI for:**
- Generating boilerplate Angular component scaffolding (the `@Component` decorator structure, `CommonModule` imports list)
- Drafting the nginx reverse-proxy config for WebSocket upgrade headers
- Checking the correct SignalR `.withAutomaticReconnect()` API shape

**What I designed and decided myself:**
- The pricing rule stacking decision (multiplicative vs additive) and reasoning
- The "server-only pricing, preview endpoint per quantity change" architecture
- The invalidation-based sync pattern (broadcast event → clients re-fetch) vs push-diff
- The immutable cart line replacement pattern to trigger Angular change detection
- The status workflow state machine and cancellation guard logic
- The split-panel single-page layout decision
- The bulk discount retroactivity problem and its solution
=======
I used AI to help with boilerplate — Angular component scaffolding, the nginx WebSocket proxy config, and Docker Compose syntax.

The architecture decisions were mine: the preview-price approach, the SignalR invalidation pattern, the replace-not-mutate cart fix, and tracking down the enum serialization bug where C# was returning integers and Angular was expecting strings.
>>>>>>> 9ae8ad380da8f057cb5719e68441f0311d8f92fe
