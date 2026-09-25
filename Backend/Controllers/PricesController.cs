using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PricesController : ControllerBase
    {
        private readonly PriceService _priceService;
        private readonly ILogger<PricesController> _logger;

        public PricesController(PriceService priceService, ILogger<PricesController> logger)
        {
            _priceService = priceService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<PriceDto>>> GetPrices()
        {
            var prices = await _priceService.GetCurrentPricesAsync();
            return Ok(prices);
        }

        [HttpGet("{id:int}/history")]
        public async Task<ActionResult<List<PriceHistoryPointDto>>> GetHistory(int id, [FromQuery] string range = "30d")
        {
            var history = await _priceService.GetPriceHistoryAsync(id, range);
            return Ok(history);
        }

        [HttpPost("sync")]
        public IActionResult TriggerSync()
        {
            _logger.LogInformation("Manual sync requested via API POST /api/prices/sync");
            _ = Task.Run(async () =>
            {
                await _priceService.SyncAllPricesAsync();
            });

            return Accepted(new { message = "Price synchronization started in background." });
        }
    }
}
