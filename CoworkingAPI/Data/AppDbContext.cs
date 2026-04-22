using Microsoft.EntityFrameworkCore;
using CoworkingAPI.Models;

namespace CoworkingAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Location> Locations { get; set; }
        public DbSet<Space> Spaces { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<User> Users { get; set; }
    }
}
