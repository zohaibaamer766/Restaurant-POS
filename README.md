# Restaurant POS — Quick-Service Order & Kitchen Workflow

Built for Solvefy's ASP.NET Core & Angular test task.

---

## Running the Project

**Backend**
```bash
cd backend/RestaurantPOS.API
dotnet run
# http://localhost:5000/swagger
```

**Frontend**
```bash
cd frontend
npm install
npm start
# http://localhost:4200
```

---

## Architecture

The backend is split into three layers. `DataStore` holds everything in memory. `PricingService` handles all discount calculations. `OrderService` manages order lifecycle and enforces the status workflow. Controllers are thin — they call a service, broadcast a SignalR event, and return the result.

The frontend has two panels on one page — cashier on the left, kitchen on the right. `CartService` holds cart state as a `BehaviorSubject`. `ApiService` handles all HTTP calls. `SignalrService` listens for backend broadcasts and tells the kitchen panel to re-fetch.

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

---

## AI Usage

I used AI to help with boilerplate — Angular component scaffolding, the nginx WebSocket proxy config, and Docker Compose syntax.

The architecture decisions were mine: the preview-price approach, the SignalR invalidation pattern, the replace-not-mutate cart fix, and tracking down the enum serialization bug where C# was returning integers and Angular was expecting strings.
