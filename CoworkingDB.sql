-- =========================================
-- 專案：共享辦公室租賃系統
-- =========================================

-- 1. 建立 Locations (房地產據點表)
CREATE TABLE [dbo].[Locations] (
    [location_id] INT           IDENTITY (1, 1) NOT NULL,
    [country]     NVARCHAR (50) NULL,
    [city]        NVARCHAR (50) NULL,
    [address]     NVARCHAR (50) NULL,
    [phone]       NVARCHAR (50) NULL,
    [longitude]   DECIMAL (18)  NULL,
    [latitude]    DECIMAL (18)  NULL,
    CONSTRAINT [PK_Locations] PRIMARY KEY CLUSTERED ([location_id] ASC)
);
GO

-- 2. 建立 Spaces (空間/辦公室表)
CREATE TABLE [dbo].[Spaces] (
    [space_id]     INT           IDENTITY (1, 1) NOT NULL,
    [location_id]  INT           NULL,
    [space_number] NVARCHAR (50) NULL,
    [capacity]     INT           NULL,
    [status]       INT           NULL,
    [image]        NVARCHAR (50) NULL,
    CONSTRAINT [PK_Spaces] PRIMARY KEY CLUSTERED ([space_id] ASC),
    CONSTRAINT [FK_Spaces_Locations] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Locations] ([location_id])
);
GO

-- 3. 建立 Users (使用者表)
CREATE TABLE [dbo].[Users] (
    [user_id]   INT           IDENTITY (1, 1) NOT NULL,
    [name]      NVARCHAR (50) NULL,
    [email]     NVARCHAR (50) NULL,
    [password]  NVARCHAR (50) NULL,
    [image]     NVARCHAR (50) NULL,
    [phone]     NVARCHAR (50) NULL,
    [role]      INT           NULL,
    [line_id]   NVARCHAR (50) NULL,
    [is_active] BIT           NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([user_id] ASC)
);
GO

-- 4. 建立 rents (租金表)
CREATE TABLE [dbo].[rents] (
    [rent_id]    INT          IDENTITY (1, 1) NOT NULL,
    [space_id]   INT          NULL,
    [price_type] INT          NULL,
    [price]      DECIMAL (18) NULL,
    [is_active]  BIT          NULL,
    CONSTRAINT [PK_rents] PRIMARY KEY CLUSTERED ([rent_id] ASC)
);
GO

-- 5. 建立 booking (預訂/合約表)
CREATE TABLE [dbo].[booking] (
    [contract_id]        INT           IDENTITY (1, 1) NOT NULL,
    [user_id]            INT           NULL,
    [rent_id]            INT           NULL,
    [employees_id]       INT           NULL,
    [created_date]       DATETIME      NULL,
    [start_date]         DATETIME      NULL,
    [end_date]           DATETIME      NULL,
    [company_name]       NVARCHAR (50) NULL,
    [tax_id]             INT           NULL,
    [pay_deadline]       DATETIME      NULL,
    [cancelled_daedline] DATETIME      NULL,
    [total_price]        DECIMAL (18)  NULL,
    [status]             INT           NULL,
    CONSTRAINT [PK_Contracts] PRIMARY KEY CLUSTERED ([contract_id] ASC),
    CONSTRAINT [FK_Contracts_Companies] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]),
    CONSTRAINT [FK_Contracts_Spaces] FOREIGN KEY ([rent_id]) REFERENCES [dbo].[rents] ([rent_id])
);
GO

-- 6. 建立 employees (員工表)
CREATE TABLE [dbo].[employees] (
    [employees_id] INT           IDENTITY (1, 1) NOT NULL,
    [user_id]      INT           NULL,
    [location_id]  INT           NULL,
    [birth]        DATE          NULL,
    [department]   NVARCHAR (50) NULL,
    [job_title]    NVARCHAR (50) NULL,
    [is_active]    BIT           NULL,
    CONSTRAINT [PK_employees] PRIMARY KEY CLUSTERED ([employees_id] ASC)
);
GO

-- 7. 建立 equipment (設備表)
CREATE TABLE [dbo].[equipment] (
    [equipment_id] INT           IDENTITY (1, 1) NOT NULL,
    [location_id]  INT           NULL,
    [category]     NVARCHAR (50) NULL,
    [full_name]    NVARCHAR (50) NULL,
    [create_date]  DATETIME      NULL,
    [cost]         DECIMAL (18)  NULL,
    [total_amount] INT           NULL,
    CONSTRAINT [PK_equipment] PRIMARY KEY CLUSTERED ([equipment_id] ASC)
);
GO

-- 8. 建立 fix_list (維修清單表)
CREATE TABLE [dbo].[fix_list] (
    [fix_id]          INT           IDENTITY (1, 1) NOT NULL,
    [space_id]        INT           NULL,
    [category]        NVARCHAR (50) NULL,
    [create_date]     DATETIME      NULL,
    [completion_date] DATETIME      NULL,
    [is_active]       BIT           NULL,
    CONSTRAINT [PK_fix_list] PRIMARY KEY CLUSTERED ([fix_id] ASC)
);
GO

-- 9. 建立 space_asserts (空間資產表)
CREATE TABLE [dbo].[space_asserts] (
    [asserts_id] INT           IDENTITY (1, 1) NOT NULL,
    [space_id]   INT           NULL,
    [category]   NVARCHAR (50) NULL,
    [amount]     DECIMAL (18)  NULL,
    CONSTRAINT [PK_space_asserts] PRIMARY KEY CLUSTERED ([asserts_id] ASC)
);
GO
