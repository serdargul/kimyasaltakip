using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Services
{
    public class PubChemService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<PubChemService> _logger;

        public PubChemService(HttpClient httpClient, ILogger<PubChemService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "ChemicalPriceTracker/1.0");
        }

        public async Task<string?> FindCasNumberAsync(string chemicalName)
        {
            if (string.IsNullOrWhiteSpace(chemicalName)) return null;

            try
            {
                var encodedName = Uri.EscapeDataString(chemicalName.Trim());
                var url = $"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encodedName}/property/IUPACName,Title,RN/JSON";

                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("PubChem lookup failed for {ChemicalName}: HTTP {StatusCode}", chemicalName, response.StatusCode);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                if (root.TryGetProperty("PropertyTable", out var propTable) &&
                    propTable.TryGetProperty("Properties", out var props) &&
                    props.ValueKind == JsonValueKind.Array && props.GetArrayLength() > 0)
                {
                    var firstMatch = props[0];
                    if (firstMatch.TryGetProperty("RN", out var rn))
                    {
                        var cas = rn.GetString();
                        if (!string.IsNullOrWhiteSpace(cas))
                        {
                            _logger.LogInformation("PubChem found CAS {CAS} for chemical {ChemicalName}", cas, chemicalName);
                            return cas;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching CAS from PubChem for {ChemicalName}", chemicalName);
            }

            return null;
        }
    }
}
