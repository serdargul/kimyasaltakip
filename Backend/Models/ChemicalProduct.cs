using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class ChemicalProduct
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string DisplayName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string ChemicalName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? CAS { get; set; }

        [MaxLength(50)]
        public string? Concentration { get; set; }

        [MaxLength(50)]
        public string? Form { get; set; }

        [MaxLength(50)]
        public string? Grade { get; set; }

        [MaxLength(300)]
        public string? GuideChemUrl { get; set; }

        [MaxLength(100)]
        public string? SpecificationFilter { get; set; }

        [MaxLength(100)]
        public string? RegionFilter { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? LastCheckedAt { get; set; }

        public DateTime? LastSuccessfulFetchAt { get; set; }

        [MaxLength(50)]
        public string FetchStatus { get; set; } = "PENDING"; // PENDING, SUCCESS, MATCH_NOT_FOUND, FETCH_ERROR, UNRESOLVED_CAS

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<PriceHistory> PriceHistories { get; set; } = new List<PriceHistory>();
    }
}
