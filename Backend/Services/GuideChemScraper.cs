using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Backend.Models;
using HtmlAgilityPack;

namespace Backend.Services
{
    public class ScrapedPriceResult
    {
        public decimal? Price { get; set; }
        public decimal? PriceLow { get; set; }
        public decimal? PriceHigh { get; set; }
        public string Currency { get; set; } = "CNY";
        public string Unit { get; set; } = "TON";
        public string? Region { get; set; }
        public string? Specification { get; set; }
        public DateTime SourceDate { get; set; } = DateTime.UtcNow.Date;
        public string Status { get; set; } = "SUCCESS"; // SUCCESS, MATCH_NOT_FOUND, FETCH_ERROR
        public string? ErrorMessage { get; set; }
    }

    public class GuideChemScraper
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GuideChemScraper> _logger;

        public GuideChemScraper(HttpClient httpClient, ILogger<GuideChemScraper> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            }
        }

        public async Task<ScrapedPriceResult> ScrapePriceAsync(ChemicalProduct product)
        {
            var results = await ScrapePricesAsync(product);
            return results.FirstOrDefault(r => r.Status == "SUCCESS") ?? results.FirstOrDefault() ?? new ScrapedPriceResult { Status = "MATCH_NOT_FOUND" };
        }

        public async Task<List<ScrapedPriceResult>> ScrapePricesAsync(ChemicalProduct product)
        {
            if (string.IsNullOrWhiteSpace(product.GuideChemUrl) && !string.IsNullOrWhiteSpace(product.CAS))
            {
                product.GuideChemUrl = $"https://www.guidechem.com/price/en/{product.CAS}.html";
            }

            if (string.IsNullOrWhiteSpace(product.GuideChemUrl))
            {
                _logger.LogWarning("No GuideChem URL or CAS available for chemical {DisplayName}", product.DisplayName);
                return new List<ScrapedPriceResult>
                {
                    new ScrapedPriceResult
                    {
                        Status = "UNRESOLVED_CAS",
                        ErrorMessage = "CAS or GuideChem URL missing"
                    }
                };
            }

            try
            {
                _logger.LogInformation("Fetching GuideChem page: {Url} for {DisplayName}", product.GuideChemUrl, product.DisplayName);
                var response = await _httpClient.GetAsync(product.GuideChemUrl);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("GuideChem HTTP error {StatusCode} for {Url}", response.StatusCode, product.GuideChemUrl);
                    return new List<ScrapedPriceResult>
                    {
                        new ScrapedPriceResult
                        {
                            Status = "FETCH_ERROR",
                            ErrorMessage = $"HTTP {(int)response.StatusCode} {response.StatusCode}"
                        }
                    };
                }

                var html = await response.Content.ReadAsStringAsync();
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                return ExtractAllPricesFromDoc(doc, product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to scrape GuideChem page for {DisplayName}", product.DisplayName);
                return new List<ScrapedPriceResult>
                {
                    new ScrapedPriceResult
                    {
                        Status = "FETCH_ERROR",
                        ErrorMessage = ex.Message
                    }
                };
            }
        }

        private List<ScrapedPriceResult> ExtractAllPricesFromDoc(HtmlDocument doc, ChemicalProduct product)
        {
            var results = new List<ScrapedPriceResult>();

            var analysisDl = doc.DocumentNode.SelectSingleNode("//dl[contains(@class,'analysis')]");
            var dtHeader = analysisDl?.SelectSingleNode("./dt");

            var headerDates = new List<DateTime>();
            if (dtHeader != null)
            {
                var dateSpans = dtHeader.SelectNodes("./span[contains(@class,'bxs_kfh')]");
                if (dateSpans != null)
                {
                    foreach (var span in dateSpans)
                    {
                        var text = span.InnerText.Trim();
                        if (DateTime.TryParseExact(text, "yyyy/MM/dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                        {
                            headerDates.Add(parsedDate);
                        }
                        else if (DateTime.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate2))
                        {
                            headerDates.Add(parsedDate2);
                        }
                    }
                }
            }

            var rowNodes = doc.DocumentNode.SelectNodes("//dl[contains(@class,'analysis')]//dd//ul//li");
            if (rowNodes != null && rowNodes.Count > 0)
            {
                var specFilter = product.SpecificationFilter?.Trim();
                var formFilter = product.Form?.Trim();
                var concFilter = product.Concentration?.Trim();

                HtmlNode? matchedLi = null;

                foreach (var li in rowNodes)
                {
                    var region = li.SelectSingleNode("./span[contains(@class,'bx_ls_k1')]")?.InnerText?.Trim() ?? "";
                    var spec = li.SelectSingleNode("./span[contains(@class,'bx_ls_k2')]")?.InnerText?.Trim() ?? "";

                    bool match = true;
                    if (!string.IsNullOrEmpty(specFilter))
                    {
                        match = match && spec.Contains(specFilter, StringComparison.OrdinalIgnoreCase);
                    }
                    if (!string.IsNullOrEmpty(concFilter))
                    {
                        match = match && spec.Contains(concFilter, StringComparison.OrdinalIgnoreCase);
                    }
                    if (!string.IsNullOrEmpty(formFilter))
                    {
                        match = match && (spec.Contains(formFilter, StringComparison.OrdinalIgnoreCase) || region.Contains(formFilter, StringComparison.OrdinalIgnoreCase));
                    }

                    if (match)
                    {
                        matchedLi = li;
                        break;
                    }
                }

                if (matchedLi == null)
                {
                    matchedLi = rowNodes.FirstOrDefault();
                }

                if (matchedLi != null)
                {
                    var region = matchedLi.SelectSingleNode("./span[contains(@class,'bx_ls_k1')]")?.InnerText?.Trim() ?? "";
                    var spec = matchedLi.SelectSingleNode("./span[contains(@class,'bx_ls_k2')]")?.InnerText?.Trim() ?? "";
                    var unitText = matchedLi.SelectSingleNode("./span[contains(@class,'bx_ls_k7')]")?.InnerText?.Trim() ?? "CNY/TON";
                    var (currency, unit) = ParseCurrencyAndUnit(unitText);

                    if (headerDates.Count > 0)
                    {
                        for (int i = 0; i < headerDates.Count; i++)
                        {
                            var date = headerDates[i];
                            var priceSpanClass = $"bx_ls_k{3 + i}";
                            var priceSpan = matchedLi.SelectSingleNode($"./span[contains(@class,'{priceSpanClass}')]");
                            if (priceSpan != null)
                            {
                                var priceText = priceSpan.InnerText.Trim();
                                var parsed = ParsePriceString(priceText);
                                if (parsed.price.HasValue)
                                {
                                    results.Add(new ScrapedPriceResult
                                    {
                                        Price = parsed.price,
                                        PriceLow = parsed.priceLow,
                                        PriceHigh = parsed.priceHigh,
                                        Currency = currency,
                                        Unit = unit,
                                        Region = region,
                                        Specification = spec,
                                        SourceDate = date,
                                        Status = "SUCCESS"
                                    });
                                }
                            }
                        }
                    }

                    if (results.Count > 0)
                    {
                        return results;
                    }
                }
            }

            var singleResult = ExtractPriceFromDoc(doc, product);
            if (singleResult != null)
            {
                results.Add(singleResult);
            }

            return results;
        }

        private ScrapedPriceResult ExtractPriceFromDoc(HtmlDocument doc, ChemicalProduct product)
        {
            // 1. Try to extract detailed rows from price sources table <dl class="analysis">
            var analysisDl = doc.DocumentNode.SelectSingleNode("//dl[contains(@class,'analysis')]");
            var dtHeader = analysisDl?.SelectSingleNode("./dt");

            // Extract date columns from dt headers
            var headerDates = new List<DateTime>();
            if (dtHeader != null)
            {
                var dateSpans = dtHeader.SelectNodes("./span[contains(@class,'bxs_kfh')]");
                if (dateSpans != null)
                {
                    foreach (var span in dateSpans)
                    {
                        var text = span.InnerText.Trim();
                        if (DateTime.TryParseExact(text, "yyyy/MM/dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                        {
                            headerDates.Add(parsedDate);
                        }
                    }
                }
            }

            var latestHeaderDate = headerDates.Count > 0 ? headerDates.Max() : DateTime.UtcNow.Date;

            // Find rows
            var rowNodes = doc.DocumentNode.SelectNodes("//dl[contains(@class,'analysis')]//dd//ul//li");
            if (rowNodes != null && rowNodes.Count > 0)
            {
                var candidateRows = new List<(string region, string spec, string priceText, string unitText)>();

                foreach (var li in rowNodes)
                {
                    var region = li.SelectSingleNode("./span[contains(@class,'bx_ls_k1')]")?.InnerText?.Trim() ?? "";
                    var spec = li.SelectSingleNode("./span[contains(@class,'bx_ls_k2')]")?.InnerText?.Trim() ?? "";
                    var unitText = li.SelectSingleNode("./span[contains(@class,'bx_ls_k7')]")?.InnerText?.Trim() ?? "CNY/TON";

                    // Pick the last price span (bx_ls_k5 or bx_ls_k4 or bx_ls_k3)
                    var priceSpans = li.SelectNodes("./span[contains(@class,'bx_ls_k')]");
                    string priceText = "-";
                    if (priceSpans != null)
                    {
                        for (int i = priceSpans.Count - 1; i >= 0; i--)
                        {
                            var cls = priceSpans[i].GetAttributeValue("class", "");
                            if (cls.Contains("bx_ls_k3") || cls.Contains("bx_ls_k4") || cls.Contains("bx_ls_k5"))
                            {
                                var txt = priceSpans[i].InnerText.Trim();
                                if (!string.IsNullOrWhiteSpace(txt) && txt != "-")
                                {
                                    priceText = txt;
                                    break;
                                }
                            }
                        }
                    }

                    if (priceText != "-")
                    {
                        candidateRows.Add((region, spec, priceText, unitText));
                    }
                }

                // Filter candidates by product specification filter & form filter if required
                var specFilter = product.SpecificationFilter?.Trim();
                var formFilter = product.Form?.Trim();
                var concFilter = product.Concentration?.Trim();

                var matchedRow = candidateRows.FirstOrDefault(r =>
                {
                    bool match = true;
                    if (!string.IsNullOrEmpty(specFilter))
                    {
                        match = match && r.spec.Contains(specFilter, StringComparison.OrdinalIgnoreCase);
                    }
                    if (!string.IsNullOrEmpty(concFilter))
                    {
                        match = match && r.spec.Contains(concFilter, StringComparison.OrdinalIgnoreCase);
                    }
                    if (!string.IsNullOrEmpty(formFilter))
                    {
                        match = match && (r.spec.Contains(formFilter, StringComparison.OrdinalIgnoreCase) || r.region.Contains(formFilter, StringComparison.OrdinalIgnoreCase));
                    }
                    return match;
                });

                if (matchedRow != default)
                {
                    var parsedPrice = ParsePriceString(matchedRow.priceText);
                    var (currency, unit) = ParseCurrencyAndUnit(matchedRow.unitText);

                    return new ScrapedPriceResult
                    {
                        Price = parsedPrice.price,
                        PriceLow = parsedPrice.priceLow,
                        PriceHigh = parsedPrice.priceHigh,
                        Currency = currency,
                        Unit = unit,
                        Region = matchedRow.region,
                        Specification = matchedRow.spec,
                        SourceDate = latestHeaderDate,
                        Status = "SUCCESS"
                    };
                }
                else if (candidateRows.Count > 0)
                {
                    // If strict filter didn't match specific row, pick top market candidate row
                    var topRow = candidateRows.First();
                    var parsedPrice = ParsePriceString(topRow.priceText);
                    var (currency, unit) = ParseCurrencyAndUnit(topRow.unitText);

                    _logger.LogInformation("Product {DisplayName} filter '{SpecFilter}' fell back to top table candidate spec '{Spec}'",
                        product.DisplayName, specFilter, topRow.spec);

                    return new ScrapedPriceResult
                    {
                        Price = parsedPrice.price,
                        PriceLow = parsedPrice.priceLow,
                        PriceHigh = parsedPrice.priceHigh,
                        Currency = currency,
                        Unit = unit,
                        Region = topRow.region,
                        Specification = topRow.spec,
                        SourceDate = latestHeaderDate,
                        Status = "SUCCESS"
                    };
                }
            }

            // 2. Fallback to top JSON-LD or banner price if table rows were empty
            var jsonLdScript = doc.DocumentNode.SelectSingleNode("//script[@type='application/ld+json']");
            if (jsonLdScript != null)
            {
                try
                {
                    using var jsonDoc = JsonDocument.Parse(jsonLdScript.InnerText);
                    if (jsonDoc.RootElement.TryGetProperty("@graph", out var graph))
                    {
                        foreach (var item in graph.EnumerateArray())
                        {
                            if (item.TryGetProperty("@type", out var type) && type.GetString() == "Product" &&
                                item.TryGetProperty("offers", out var offers))
                            {
                                var priceStr = offers.GetProperty("price").GetString();
                                var currency = offers.GetProperty("priceCurrency").GetString() ?? "CNY";
                                var validUntilStr = offers.TryGetProperty("priceValidUntil", out var vu) ? vu.GetString() : null;

                                if (decimal.TryParse(priceStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var priceVal))
                                {
                                    DateTime.TryParse(validUntilStr, out var validDate);
                                    return new ScrapedPriceResult
                                    {
                                        Price = priceVal,
                                        Currency = currency,
                                        Unit = "TON",
                                        SourceDate = validDate != default ? validDate : DateTime.UtcNow.Date,
                                        Status = "SUCCESS"
                                    };
                                }
                            }
                        }
                    }
                }
                catch (Exception jsonEx)
                {
                    _logger.LogDebug(jsonEx, "Failed to parse JSON-LD fallback for {DisplayName}", product.DisplayName);
                }
            }

            // Banner HTML fallback
            var bannerPriceNode = doc.DocumentNode.SelectSingleNode("//li[contains(@class,'i_rd_x1')]//em");
            var bannerDateNode = doc.DocumentNode.SelectSingleNode("//li[contains(@class,'i_rd_x1')]//i");
            if (bannerPriceNode != null)
            {
                var priceTxt = bannerPriceNode.InnerText.Trim();
                if (decimal.TryParse(priceTxt, NumberStyles.Any, CultureInfo.InvariantCulture, out var bPrice))
                {
                    DateTime sourceDate = DateTime.UtcNow.Date;
                    if (bannerDateNode != null)
                    {
                        var match = Regex.Match(bannerDateNode.InnerText, @"\d{4}-\d{2}-\d{2}");
                        if (match.Success && DateTime.TryParse(match.Value, out var pDate))
                        {
                            sourceDate = pDate;
                        }
                    }

                    return new ScrapedPriceResult
                    {
                        Price = bPrice,
                        Currency = "CNY",
                        Unit = "TON",
                        SourceDate = sourceDate,
                        Status = "SUCCESS"
                    };
                }
            }

            return new ScrapedPriceResult
            {
                Status = "MATCH_NOT_FOUND",
                ErrorMessage = "Could not locate valid price element"
            };
        }

        private (decimal? price, decimal? priceLow, decimal? priceHigh) ParsePriceString(string priceText)
        {
            if (string.IsNullOrWhiteSpace(priceText) || priceText == "-")
                return (null, null, null);

            // Check range: e.g. "3900-4200" or "3637 - 3903"
            var rangeMatch = Regex.Match(priceText, @"([\d\.]+)\s*-\s*([\d\.]+)");
            if (rangeMatch.Success)
            {
                if (decimal.TryParse(rangeMatch.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var low) &&
                    decimal.TryParse(rangeMatch.Groups[2].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var high))
                {
                    var avg = (low + high) / 2m;
                    return (avg, low, high);
                }
            }

            // Single price
            var singleMatch = Regex.Match(priceText, @"[\d\.]+");
            if (singleMatch.Success && decimal.TryParse(singleMatch.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var single))
            {
                return (single, single, single);
            }

            return (null, null, null);
        }

        private (string currency, string unit) ParseCurrencyAndUnit(string unitText)
        {
            if (string.IsNullOrWhiteSpace(unitText))
                return ("CNY", "TON");

            // e.g. "CNY/TON", "USD/TON", "USD/KG"
            var parts = unitText.Split('/');
            if (parts.Length >= 2)
            {
                var currency = parts[0].Trim().ToUpperInvariant();
                var unit = parts[1].Trim().ToUpperInvariant();
                return (currency, unit);
            }

            return ("CNY", unitText.Trim().ToUpperInvariant());
        }
    }
}
