using System.Text.Json.Serialization;
using RestaurantPOS.API.Hubs;
using RestaurantPOS.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Explicitly set URL so frontend proxy always finds it on port 5000
builder.WebHost.UseUrls("http://localhost:5000");

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Serialize enums as strings ("HotFood" not 0, "Pending" not 0)
        // This is what the Angular frontend expects
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Restaurant POS API", Version = "v1" });
});

// Singleton data store — in-memory, shared across requests
builder.Services.AddSingleton<DataStore>();
builder.Services.AddSingleton<PricingService>();
builder.Services.AddSingleton<OrderService>();

// SignalR for live kitchen display updates
builder.Services.AddSignalR()
    .AddJsonProtocol(opts =>
    {
        // Same enum-as-string setting for SignalR messages
        opts.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins(
                  "http://localhost:4200",
                  "http://localhost:80",
                  "http://localhost"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Restaurant POS API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAngular");
app.MapControllers();
app.MapHub<PosHub>("/hubs/pos");

app.Run();