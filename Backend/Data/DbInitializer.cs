using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.EnsureCreated();

            var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var initialProducts = new List<ChemicalProduct>
            {
                new ChemicalProduct { DisplayName = "SİTRİK ASİT MONO", ChemicalName = "Citric Acid Monohydrate", CAS = "5949-29-1", GuideChemUrl = "https://www.guidechem.com/price/en/5949-29-1.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "ASETON", ChemicalName = "Acetone", CAS = "67-64-1", GuideChemUrl = "https://www.guidechem.com/price/en/67-64-1.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "GLİSERİN", ChemicalName = "Glycerin", CAS = "56-81-5", GuideChemUrl = "https://www.guidechem.com/price/en/56-81-5.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "LARSA (LABSA)", ChemicalName = "Dodecylbenzenesulfonic Acid", CAS = "27176-87-0", GuideChemUrl = "https://www.guidechem.com/price/en/27176-87-0.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "SLES 70", ChemicalName = "Sodium Lauryl Ether Sulfate", CAS = "68585-34-2", GuideChemUrl = "https://www.guidechem.com/price/en/68585-34-2.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "SODYUM KLORİT %31", ChemicalName = "Sodium Chlorite", CAS = "7758-19-2", GuideChemUrl = "https://www.guidechem.com/price/en/7758-19-2.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "ASETİK ASİT %80", ChemicalName = "Acetic Acid", CAS = "64-19-7", GuideChemUrl = "https://www.guidechem.com/price/en/64-19-7.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "FORMİK ASİT %85", ChemicalName = "Formic Acid", CAS = "64-18-6", GuideChemUrl = "https://www.guidechem.com/price/en/64-18-6.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "HİDROJEN PEROKSİT %50", ChemicalName = "Hydrogen Peroxide", CAS = "7722-84-1", GuideChemUrl = "https://www.guidechem.com/price/en/7722-84-1.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "OKSALİK ASİT %99", ChemicalName = "Oxalic Acid", CAS = "144-62-7", GuideChemUrl = "https://www.guidechem.com/price/en/144-62-7.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "HAFİF SODA", ChemicalName = "Soda Ash Light", CAS = "497-19-8", GuideChemUrl = "https://www.guidechem.com/price/en/497-19-8.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "PEG 400", ChemicalName = "Polyethylene Glycol 400", CAS = "25322-68-3", GuideChemUrl = "https://www.guidechem.com/price/en/25322-68-3.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "SODYUM HİDROSÜLFİT %88", ChemicalName = "Sodium Hydrosulfite", CAS = "7775-14-6", GuideChemUrl = "https://www.guidechem.com/price/en/7775-14-6.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "SODYUM HİDROKSİT %48", ChemicalName = "Sodium Hydroxide", CAS = "1310-73-2", GuideChemUrl = "https://www.guidechem.com/price/en/1310-73-2.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate },
                new ChemicalProduct { DisplayName = "SODYUM METABİSÜLFİT", ChemicalName = "Sodium Metabisulfite", CAS = "7681-57-4", GuideChemUrl = "https://www.guidechem.com/price/en/7681-57-4.html", IsActive = true, FetchStatus = "PENDING", CreatedAt = seedDate, UpdatedAt = seedDate }
            };

            var existingProducts = context.ChemicalProducts.ToList();

            foreach (var initProd in initialProducts)
            {
                var match = existingProducts.FirstOrDefault(p => p.DisplayName.Equals(initProd.DisplayName, StringComparison.OrdinalIgnoreCase) ||
                                                                  (p.DisplayName.Contains("LARSA") && initProd.DisplayName.Contains("LARSA")));
                if (match == null)
                {
                    context.ChemicalProducts.Add(initProd);
                }
                else
                {
                    match.CAS = initProd.CAS;
                    match.ChemicalName = initProd.ChemicalName;
                    match.GuideChemUrl = initProd.GuideChemUrl;
                    match.DisplayName = initProd.DisplayName;
                    match.FetchStatus = "PENDING";
                }
            }

            context.SaveChanges();

            // Seed initial baseline price history so products have instant price & previous price on first launch
            var allProducts = context.ChemicalProducts.ToList();
            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            var baselinePrices = new Dictionary<string, (decimal current, decimal prev)>
            {
                { "SİTRİK ASİT MONO", (5888m, 5850m) },
                { "ASETON", (8763m, 8700m) },
                { "GLİSERİN", (8800m, 8750m) },
                { "LARSA (LABSA)", (10000m, 9950m) },
                { "SLES 70", (13000m, 12900m) },
                { "SODYUM KLORİT %31", (3900m, 3880m) },
                { "ASETİK ASİT %80", (4603m, 4580m) },
                { "FORMİK ASİT %85", (2050m, 2040m) },
                { "HİDROJEN PEROKSİT %50", (5500m, 5450m) },
                { "OKSALİK ASİT %99", (3525m, 3500m) },
                { "HAFİF SODA", (1460m, 1450m) },
                { "PEG 400", (8300m, 8250m) },
                { "SODYUM HİDROSÜLFİT %88", (2600m, 2580m) },
                { "SODYUM HİDROKSİT %48", (2567m, 2550m) },
                { "SODYUM METABİSÜLFİT", (3725m, 3700m) }
            };

            foreach (var p in allProducts)
            {
                var historyCount = context.PriceHistories.Count(h => h.ChemicalProductId == p.Id);
                if (historyCount == 0 && baselinePrices.TryGetValue(p.DisplayName, out var prices))
                {
                    context.PriceHistories.Add(new PriceHistory
                    {
                        ChemicalProductId = p.Id,
                        Price = prices.prev,
                        PriceLow = prices.prev,
                        PriceHigh = prices.prev,
                        Currency = "CNY",
                        Unit = "TON",
                        SourceDate = yesterday,
                        FetchedAt = yesterday,
                        Source = "Baseline"
                    });

                    context.PriceHistories.Add(new PriceHistory
                    {
                        ChemicalProductId = p.Id,
                        Price = prices.current,
                        PriceLow = prices.current,
                        PriceHigh = prices.current,
                        Currency = "CNY",
                        Unit = "TON",
                        SourceDate = today,
                        FetchedAt = today,
                        Source = "Baseline"
                    });

                    p.FetchStatus = "SUCCESS";
                    p.LastSuccessfulFetchAt = today;
                    p.LastCheckedAt = today;
                }
            }

            context.SaveChanges();
        }
    }
}
