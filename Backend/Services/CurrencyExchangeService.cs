using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Backend.Services
{
    public class ExchangeRates
    {
        public decimal UsdRate { get; set; } = 0.149m; // 1 CNY = ~0.149 USD
        public decimal EurRate { get; set; } = 0.130m; // 1 CNY = ~0.130 EUR
        public DateTime LastFetchedAt { get; set; } = DateTime.MinValue;
        public string Source { get; set; } = "Google Finance";
    }

    public class CurrencyExchangeService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CurrencyExchangeService> _logger;
        private ExchangeRates _cachedRates = new ExchangeRates();

        public CurrencyExchangeService(HttpClient httpClient, ILogger<CurrencyExchangeService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            }
        }

        public async Task<ExchangeRates> GetLiveRatesAsync(bool forceRefresh = false)
        {
            // Cache for 4 hours unless forceRefresh is requested
            if (!forceRefresh && _cachedRates.LastFetchedAt > DateTime.UtcNow.AddHours(-4))
            {
                return _cachedRates;
            }

            _logger.LogInformation("Fetching live USD and EUR exchange rates from Google / API...");

            decimal usdRate = 0m;
            decimal eurRate = 0m;
            string source = "Google";

            // 1. Try Google Search / Google Finance for CNY to USD
            try
            {
                usdRate = await FetchRateFromGoogleAsync("CNY", "USD");
                eurRate = await FetchRateFromGoogleAsync("CNY", "EUR");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not parse exchange rate directly from Google Search. Trying Exchange Rate API fallback...");
            }

            // 2. Fallback to Open Exchange Rate API if Google rate parsing failed
            if (usdRate <= 0m || eurRate <= 0m)
            {
                try
                {
                    var apiResult = await FetchRatesFromApiAsync();
                    if (apiResult.usd > 0m) usdRate = apiResult.usd;
                    if (apiResult.eur > 0m) eurRate = apiResult.eur;
                    source = "ExchangeRate API";
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to fetch rates from Exchange Rate API.");
                }
            }

            // Use fallbacks if both failed
            if (usdRate <= 0m) usdRate = 0.149m;
            if (eurRate <= 0m) eurRate = 0.130m;

            _cachedRates = new ExchangeRates
            {
                UsdRate = usdRate,
                EurRate = eurRate,
                LastFetchedAt = DateTime.UtcNow,
                Source = source
            };

            _logger.LogInformation("Updated live rates from {Source}: 1 CNY = ${UsdRate:F4} USD, €{EurRate:F4} EUR",
                source, usdRate, eurRate);

            return _cachedRates;
        }

        private async Task<decimal> FetchRateFromGoogleAsync(string from, string to)
        {
            var url = $"https://www.google.com/search?q=1+{from}+to+{to}&hl=en";
            var html = await _httpClient.GetStringAsync(url);

            // Match Google Finance rate pattern e.g. data-value="0.1489" or "1 Chinese Yuan equals 0.15 United States Dollar"
            var match = Regex.Match(html, @"1\s+Chinese\s+Yuan\s+equals\s+([\d\.]+)", RegexOptions.IgnoreCase);
            if (match.Success && decimal.TryParse(match.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var rate))
            {
                return rate;
            }

            var rateAttrMatch = Regex.Match(html, @"data-exchange-rate=""([\d\.]+)""", RegexOptions.IgnoreCase);
            if (rateAttrMatch.Success && decimal.TryParse(rateAttrMatch.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var rate2))
            {
                return rate2;
            }

            return 0m;
        }

        private async Task<(decimal usd, decimal eur)> FetchRatesFromApiAsync()
        {
            var json = await _httpClient.GetStringAsync("https://open.er-api.com/v6/latest/CNY");
            using var doc = JsonDocument.Parse(json);
            var rates = doc.RootElement.GetProperty("rates");

            decimal usd = rates.GetProperty("USD").GetDecimal();
            decimal eur = rates.GetProperty("EUR").GetDecimal();

            return (usd, eur);
        }
    }
}
