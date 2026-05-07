using Microsoft.EntityFrameworkCore;
using CoworkingAPI.Models;

namespace CoworkingAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Location> Locations { get; set; }
        public DbSet<Space> Spaces { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Rent> Rents { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Equipment> Equipments { get; set; }
        public DbSet<FixList> FixLists { get; set; }
        public DbSet<SpaceAsserts> spaceasserts {get; set;}
    }
}
