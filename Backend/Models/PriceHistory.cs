using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class PriceHistory
    {
        [Key]
        public int Id { get; set; }

        public int ChemicalProductId { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? Price { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? PriceLow { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? PriceHigh { get; set; }

        [MaxLength(20)]
        public string Currency { get; set; } = "CNY";

        [MaxLength(20)]
        public string Unit { get; set; } = "TON";

        [MaxLength(100)]
        public string? Region { get; set; }

        [MaxLength(100)]
        public string? Specification { get; set; }

        public DateTime SourceDate { get; set; }

        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string Source { get; set; } = "GuideChem";

        [ForeignKey(nameof(ChemicalProductId))]
        public virtual ChemicalProduct? ChemicalProduct { get; set; }
    }
}
