using Backend.Data;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Workers
{
    public class ChemicalPriceWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ChemicalPriceWorker> _logger;

        public ChemicalPriceWorker(IServiceProvider serviceProvider, ILogger<ChemicalPriceWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ChemicalPriceWorker background service starting...");

            // Initial check on startup: if database has no prices yet, run sync immediately!
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var priceService = scope.ServiceProvider.GetRequiredService<PriceService>();

                await dbContext.Database.EnsureCreatedAsync(stoppingToken);

                var hasHistory = await dbContext.PriceHistories.AnyAsync(stoppingToken);
                if (!hasHistory)
                {
                    _logger.LogInformation("No existing price history found. Triggering initial price sync on startup...");
                    await priceService.SyncAllPricesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during initial startup price check in ChemicalPriceWorker");
            }

            // Daily loop checking time
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var nextRun = new DateTime(now.Year, now.Month, now.Day, 6, 0, 0);
                    if (now >= nextRun)
                    {
                        nextRun = nextRun.AddDays(1);
                    }

                    var delay = nextRun - now;
                    _logger.LogInformation("Next scheduled chemical price sync at: {NextRun} (in {Hours}h {Minutes}m)",
                        nextRun, (int)delay.TotalHours, delay.Minutes);

                    await Task.Delay(delay, stoppingToken);

                    using var runScope = _serviceProvider.CreateScope();
                    var priceService = runScope.ServiceProvider.GetRequiredService<PriceService>();
                    await priceService.SyncAllPricesAsync();
                }
                catch (TaskCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during scheduled ChemicalPriceWorker execution");
                    await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
                }
            }
        }
    }
}
