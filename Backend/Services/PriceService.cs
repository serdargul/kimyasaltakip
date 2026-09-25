using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class PriceDto
    {
        public int Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string ChemicalName { get; set; } = string.Empty;
        public string? CAS { get; set; }
        public decimal? CurrentPrice { get; set; }
        public decimal? PreviousPrice { get; set; }
        public decimal? CurrentPriceUsd { get; set; }
        public decimal? CurrentPriceEur { get; set; }
        public decimal? PreviousPriceUsd { get; set; }
        public decimal? PreviousPriceEur { get; set; }
        public decimal? PriceLow { get; set; }
        public decimal? PriceHigh { get; set; }
        public decimal? PriceLowUsd { get; set; }
        public decimal? PriceHighUsd { get; set; }
        public decimal? PriceLowEur { get; set; }
        public decimal? PriceHighEur { get; set; }
        public string Currency { get; set; } = "CNY";
        public string Unit { get; set; } = "TON";
        public decimal? ChangePercent { get; set; }
        public string? SourceDate { get; set; }
        public string? LastCheckedAt { get; set; }
        public string FetchStatus { get; set; } = "PENDING";
        public decimal UsdRate { get; set; }
        public decimal EurRate { get; set; }
    }

    public class PriceHistoryPointDto
    {
        public DateTime Date { get; set; }
        public decimal? Price { get; set; }
        public decimal? PriceUsd { get; set; }
        public decimal? PriceEur { get; set; }
        public string Currency { get; set; } = "CNY";
        public string Unit { get; set; } = "TON";
    }

    public class PriceService
    {
        private readonly AppDbContext _context;
        private readonly GuideChemScraper _scraper;
        private readonly PubChemService _pubChemService;
        private readonly CurrencyExchangeService _exchangeService;
        private readonly ILogger<PriceService> _logger;

        public PriceService(
            AppDbContext context,
            GuideChemScraper scraper,
            PubChemService pubChemService,
            CurrencyExchangeService exchangeService,
            ILogger<PriceService> logger)
        {
            _context = context;
            _scraper = scraper;
            _pubChemService = pubChemService;
            _exchangeService = exchangeService;
            _logger = logger;
        }

        public async Task SyncAllPricesAsync()
        {
            _logger.LogInformation("Starting daily chemical price sync...");
            var products = await _context.ChemicalProducts
                .Where(p => p.IsActive)
                .ToListAsync();

            // Refresh currency exchange rates during daily sync
            await _exchangeService.GetLiveRatesAsync(forceRefresh: true);

            foreach (var product in products)
            {
                try
                {
                    // If CAS is missing and product is not marked as UNRESOLVED, try PubChem lookup
                    if (string.IsNullOrWhiteSpace(product.CAS) && product.FetchStatus != "UNRESOLVED_CAS")
                    {
                        var cas = await _pubChemService.FindCasNumberAsync(product.ChemicalName);
                        if (!string.IsNullOrWhiteSpace(cas))
                        {
                            product.CAS = cas;
                            product.GuideChemUrl = $"https://www.guidechem.com/price/en/{cas}.html";
                        }
                        else
                        {
                            product.FetchStatus = "UNRESOLVED_CAS";
                            product.LastCheckedAt = DateTime.UtcNow;
                            product.UpdatedAt = DateTime.UtcNow;
                            await _context.SaveChangesAsync();
                            continue;
                        }
                    }

                    if (product.FetchStatus == "UNRESOLVED_CAS" && string.IsNullOrWhiteSpace(product.CAS))
                    {
                        _logger.LogInformation("Skipping scraping for unresolved product {DisplayName}", product.DisplayName);
                        product.LastCheckedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                        continue;
                    }

                    var scrapeResults = await _scraper.ScrapePricesAsync(product);
                    product.LastCheckedAt = DateTime.UtcNow;

                    var validResults = scrapeResults.Where(r => r.Status == "SUCCESS" && r.Price.HasValue).ToList();
                    if (validResults.Any())
                    {
                        product.LastSuccessfulFetchAt = DateTime.UtcNow;
                        product.FetchStatus = "SUCCESS";

                        foreach (var scrapeResult in validResults)
                        {
                            var existingHistory = await _context.PriceHistories
                                .FirstOrDefaultAsync(h => h.ChemicalProductId == product.Id &&
                                                          h.SourceDate.Date == scrapeResult.SourceDate.Date);

                            if (existingHistory == null)
                            {
                                var history = new PriceHistory
                                {
                                    ChemicalProductId = product.Id,
                                    Price = scrapeResult.Price,
                                    PriceLow = scrapeResult.PriceLow,
                                    PriceHigh = scrapeResult.PriceHigh,
                                    Currency = scrapeResult.Currency,
                                    Unit = scrapeResult.Unit,
                                    Region = scrapeResult.Region,
                                    Specification = scrapeResult.Specification,
                                    SourceDate = scrapeResult.SourceDate,
                                    FetchedAt = DateTime.UtcNow,
                                    Source = "GuideChem"
                                };

                                _context.PriceHistories.Add(history);
                                _logger.LogInformation("Added new PriceHistory for {DisplayName}: {Price} {Currency}/{Unit} ({SourceDate:yyyy-MM-dd})",
                                    product.DisplayName, scrapeResult.Price, scrapeResult.Currency, scrapeResult.Unit, scrapeResult.SourceDate);
                            }
                            else
                            {
                                existingHistory.Price = scrapeResult.Price;
                                existingHistory.PriceLow = scrapeResult.PriceLow;
                                existingHistory.PriceHigh = scrapeResult.PriceHigh;
                                existingHistory.Currency = scrapeResult.Currency;
                                existingHistory.Unit = scrapeResult.Unit;
                                existingHistory.Region = scrapeResult.Region;
                                existingHistory.Specification = scrapeResult.Specification;
                                existingHistory.FetchedAt = DateTime.UtcNow;
                            }
                        }
                    }
                    else
                    {
                        var firstErr = scrapeResults.FirstOrDefault();
                        product.FetchStatus = firstErr?.Status ?? "MATCH_NOT_FOUND";
                        _logger.LogWarning("Scrape failed for {DisplayName}: {Status} - {Error}",
                            product.DisplayName, product.FetchStatus, firstErr?.ErrorMessage);
                    }

                    product.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled exception during price sync for chemical {DisplayName}", product.DisplayName);
                    product.FetchStatus = "FETCH_ERROR";
                    product.LastCheckedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                // Respectful rate limiting pause between GuideChem requests
                await Task.Delay(1500);
            }

            _logger.LogInformation("Chemical price sync completed.");
        }

        public async Task<List<PriceDto>> GetCurrentPricesAsync()
        {
            var rates = await _exchangeService.GetLiveRatesAsync();

            var products = await _context.ChemicalProducts
                .Where(p => p.IsActive)
                .AsNoTracking()
                .ToListAsync();

            var result = new List<PriceDto>();

            foreach (var product in products)
            {
                var histories = await _context.PriceHistories
                    .Where(h => h.ChemicalProductId == product.Id)
                    .OrderByDescending(h => h.SourceDate)
                    .ThenByDescending(h => h.Id)
                    .Take(2)
                    .AsNoTracking()
                    .ToListAsync();

                var current = histories.FirstOrDefault();
                var previous = histories.Count > 1 ? histories[1] : null;

                decimal? currentPrice = current?.Price;
                decimal? previousPrice = previous?.Price;

                decimal? changePercent = null;
                if (currentPrice.HasValue && previousPrice.HasValue && previousPrice.Value != 0)
                {
                    changePercent = Math.Round(((currentPrice.Value - previousPrice.Value) / previousPrice.Value) * 100m, 2);
                }

                decimal? currentPriceUsd = currentPrice.HasValue ? Math.Round(currentPrice.Value * rates.UsdRate, 2) : null;
                decimal? currentPriceEur = currentPrice.HasValue ? Math.Round(currentPrice.Value * rates.EurRate, 2) : null;
                decimal? previousPriceUsd = previousPrice.HasValue ? Math.Round(previousPrice.Value * rates.UsdRate, 2) : null;
                decimal? previousPriceEur = previousPrice.HasValue ? Math.Round(previousPrice.Value * rates.EurRate, 2) : null;

                decimal? priceLowUsd = current?.PriceLow.HasValue == true ? Math.Round(current.PriceLow.Value * rates.UsdRate, 2) : null;
                decimal? priceHighUsd = current?.PriceHigh.HasValue == true ? Math.Round(current.PriceHigh.Value * rates.UsdRate, 2) : null;
                decimal? priceLowEur = current?.PriceLow.HasValue == true ? Math.Round(current.PriceLow.Value * rates.EurRate, 2) : null;
                decimal? priceHighEur = current?.PriceHigh.HasValue == true ? Math.Round(current.PriceHigh.Value * rates.EurRate, 2) : null;

                result.Add(new PriceDto
                {
                    Id = product.Id,
                    DisplayName = product.DisplayName,
                    ChemicalName = product.ChemicalName,
                    CAS = product.CAS,
                    CurrentPrice = currentPrice,
                    PreviousPrice = previousPrice,
                    CurrentPriceUsd = currentPriceUsd,
                    CurrentPriceEur = currentPriceEur,
                    PreviousPriceUsd = previousPriceUsd,
                    PreviousPriceEur = previousPriceEur,
                    PriceLow = current?.PriceLow,
                    PriceHigh = current?.PriceHigh,
                    PriceLowUsd = priceLowUsd,
                    PriceHighUsd = priceHighUsd,
                    PriceLowEur = priceLowEur,
                    PriceHighEur = priceHighEur,
                    Currency = current?.Currency ?? "CNY",
                    Unit = current?.Unit ?? "TON",
                    ChangePercent = changePercent,
                    SourceDate = current?.SourceDate.ToString("yyyy-MM-dd"),
                    LastCheckedAt = product.LastCheckedAt?.ToString("yyyy-MM-dd HH:mm"),
                    FetchStatus = product.FetchStatus,
                    UsdRate = rates.UsdRate,
                    EurRate = rates.EurRate
                });
            }

            return result;
        }

        public async Task<List<PriceHistoryPointDto>> GetPriceHistoryAsync(int productId, string range = "30d")
        {
            var rates = await _exchangeService.GetLiveRatesAsync();

            var query = _context.PriceHistories
                .Where(h => h.ChemicalProductId == productId);

            var now = DateTime.UtcNow.Date;
            DateTime startDate = range.ToLower() switch
            {
                "7d" => now.AddDays(-7),
                "30d" => now.AddDays(-30),
                "3m" => now.AddMonths(-3),
                "6m" => now.AddMonths(-6),
                "1y" => now.AddYears(-1),
                _ => now.AddDays(-30)
            };

            var list = await query
                .Where(h => h.SourceDate >= startDate)
                .OrderBy(h => h.SourceDate)
                .AsNoTracking()
                .ToListAsync();

            var points = list.Select(h => new PriceHistoryPointDto
            {
                Date = h.SourceDate,
                Price = h.Price,
                PriceUsd = h.Price.HasValue ? Math.Round(h.Price.Value * rates.UsdRate, 2) : null,
                PriceEur = h.Price.HasValue ? Math.Round(h.Price.Value * rates.EurRate, 2) : null,
                Currency = h.Currency,
                Unit = h.Unit
            }).ToList();

            return points;
        }
    }
}
