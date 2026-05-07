using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var employees = await _context.Employees.ToListAsync();
            return Ok(employees);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.employees_id == id);
            if (employee == null) return NotFound($"沒有{id}");
            return Ok(employee);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody] Employee Employee)
        {
            _context.Employees.Add(Employee);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), Employee);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] Employee Employee)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.employees_id == Employee.employees_id);
            if (employee == null) return NotFound($"沒有{Employee.employees_id}");
            employee.user_id = Employee.user_id;
            employee.location_id = Employee.location_id;
            employee.birth = Employee.birth;
            employee.department = Employee.department;
            employee.job_title = Employee.job_title;
            employee.is_active = Employee.is_active;

            _context.Employees.Update(employee);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.employees_id == id);
            if (employee == null) return NotFound($"沒有{id}");
            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
