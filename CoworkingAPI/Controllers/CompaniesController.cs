using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using Microsoft.EntityFrameworkCore;
using CoworkingAPI.Models;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompaniesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CompaniesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var company = await _context.Companies.ToListAsync();
            return Ok(company);
        }

       [HttpPost("Add")]
       public async Task<IActionResult> Add([FromBody]Company Company)
        {
            var company =  _context.Companies.Add(Company);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), company);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody]Company Company)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.company_id == Company.company_id);
            if (company == null)
            {
                return NotFound($"沒有{Company.company_id}");
            }
            
            company.company_name = Company.company_name;
            company.tax_id = Company.tax_id;
            company.contact_name = Company.contact_name;
            company.contact_phone = Company.contact_phone;
            company.contact_email = Company.contact_email;

            _context.Companies.Update(company);
            await _context.SaveChangesAsync();
            return NoContent();
            
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.company_id == id);
            if (company == null) return NotFound($"沒有{id}");
            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
            return NoContent();

        }
    }
}
