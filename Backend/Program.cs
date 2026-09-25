using Backend.Data;
using Backend.Services;
using Backend.Workers;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=chemicalprice.db"));

// HttpClients
builder.Services.AddHttpClient<GuideChemScraper>();
builder.Services.AddHttpClient<PubChemService>();
builder.Services.AddHttpClient<CurrencyExchangeService>();

// Domain Services
builder.Services.AddScoped<PriceService>();

// Worker Service
builder.Services.AddHostedService<ChemicalPriceWorker>();

// CORS Setup
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Auto-migrate or ensure database created
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        DbInitializer.Initialize(db);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Could not initialize SQL Server. Switching to InMemory Database...");
    }
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
