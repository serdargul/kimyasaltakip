using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<ChemicalProduct> ChemicalProducts { get; set; } = null!;
        public DbSet<PriceHistory> PriceHistories { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ChemicalProduct>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(150);
                entity.Property(e => e.ChemicalName).IsRequired().HasMaxLength(150);
            });

            modelBuilder.Entity<PriceHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.ChemicalProduct)
                      .WithMany(p => p.PriceHistories)
                      .HasForeignKey(e => e.ChemicalProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed initial 15 chemicals
            var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<ChemicalProduct>().HasData(
                new ChemicalProduct
                {
                    Id = 1,
                    DisplayName = "SİTRİK ASİT MONO",
                    ChemicalName = "Citric Acid Monohydrate",
                    CAS = "5949-29-1",
                    Concentration = "",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/5949-29-1.html",
                    SpecificationFilter = "",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 2,
                    DisplayName = "ASETON",
                    ChemicalName = "Acetone",
                    CAS = "67-64-1",
                    Concentration = "",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/67-64-1.html",
                    SpecificationFilter = "",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 3,
                    DisplayName = "GLİSERİN",
                    ChemicalName = "Glycerin",
                    CAS = "56-81-5",
                    Concentration = "",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/56-81-5.html",
                    SpecificationFilter = "",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 4,
                    DisplayName = "LARSA (LABSA)",
                    ChemicalName = "Dodecylbenzenesulfonic Acid",
                    CAS = "27176-87-0",
                    Concentration = "",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/27176-87-0.html",
                    SpecificationFilter = "",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 5,
                    DisplayName = "SLES 70",
                    ChemicalName = "Sodium Lauryl Ether Sulfate",
                    CAS = "68585-34-2",
                    Concentration = "70%",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/68585-34-2.html",
                    SpecificationFilter = "70%",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 6,
                    DisplayName = "SODYUM KLORİT %31",
                    ChemicalName = "Sodium Chlorite",
                    CAS = "7758-19-2",
                    Concentration = "31%",
                    Form = "Liquid",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/7758-19-2.html",
                    SpecificationFilter = "31%",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 7,
                    DisplayName = "ASETİK ASİT %80",
                    ChemicalName = "Acetic Acid",
                    CAS = "64-19-7",
                    Concentration = "80%",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/64-19-7.html",
                    SpecificationFilter = "80%",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 8,
                    DisplayName = "FORMİK ASİT %85",
                    ChemicalName = "Formic Acid",
                    CAS = "64-18-6",
                    Concentration = "85%",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/64-18-6.html",
                    SpecificationFilter = "85%",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 9,
                    DisplayName = "HİDROJEN PEROKSİT %50",
                    ChemicalName = "Hydrogen Peroxide",
                    CAS = "7722-84-1",
                    Concentration = "50%",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/7722-84-1.html",
                    SpecificationFilter = "50%",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 10,
                    DisplayName = "OKSALİK ASİT %99",
                    ChemicalName = "Oxalic Acid",
                    CAS = "144-62-7",
                    Concentration = "99%",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/144-62-7.html",
                    SpecificationFilter = "99%",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 11,
                    DisplayName = "HAFİF SODA",
                    ChemicalName = "Soda Ash Light",
                    CAS = "497-19-8",
                    Concentration = "",
                    Form = "",
                    Grade = "Light",
                    GuideChemUrl = "https://www.guidechem.com/price/en/497-19-8.html",
                    SpecificationFilter = "Light",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 12,
                    DisplayName = "PEG 400",
                    ChemicalName = "Polyethylene Glycol 400",
                    CAS = "25322-68-3",
                    Concentration = "",
                    Form = "",
                    Grade = "400",
                    GuideChemUrl = "https://www.guidechem.com/price/en/25322-68-3.html",
                    SpecificationFilter = "400",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 13,
                    DisplayName = "SODYUM HİDROSÜLFİT %88",
                    ChemicalName = "Sodium Hydrosulfite",
                    CAS = "7775-14-6",
                    Concentration = "88%",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/7775-14-6.html",
                    SpecificationFilter = "88%",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 14,
                    DisplayName = "SODYUM HİDROKSİT %48",
                    ChemicalName = "Sodium Hydroxide",
                    CAS = "1310-73-2",
                    Concentration = "48%",
                    Form = "Liquid",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/1310-73-2.html",
                    SpecificationFilter = "48%",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                },
                new ChemicalProduct
                {
                    Id = 15,
                    DisplayName = "SODYUM METABİSÜLFİT",
                    ChemicalName = "Sodium Metabisulfite",
                    CAS = "7681-57-4",
                    Concentration = "",
                    Form = "",
                    Grade = "",
                    GuideChemUrl = "https://www.guidechem.com/price/en/7681-57-4.html",
                    SpecificationFilter = "",
                    RegionFilter = "",
                    IsActive = true,
                    FetchStatus = "PENDING",
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate
                }
            );
        }
    }
}
