using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContractsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContractsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var contract = await _context.Contracts.ToListAsync();
            return Ok(contract);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody] Contract Contract)
        {
            _context.Contracts.Add(Contract);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), Contract);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] Contract Contract)
        {
            var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.contract_id == Contract.contract_id);
            if (contract == null) return NotFound($"沒有{Contract.contract_id}");
            contract.company_id = Contract.company_id;
            contract.space_id = Contract.space_id;
            contract.start_date = Contract.start_date;
            contract.end_date = Contract.end_date;
            contract.deposit = Contract.deposit;
            contract.is_active = Contract.is_active;

            _context.Contracts.Update(contract);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.contract_id == id);
            if (contract == null) return NotFound($"沒有{id}");
            _context.Contracts.Remove(contract);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
