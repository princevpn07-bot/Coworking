-- =========================================
-- 建立資料庫並切換使用該資料庫
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'coworkingdb')
BEGIN
    CREATE DATABASE [coworkingdb];
END
GO

USE [coworkingdb];
GO

-- =========================================
-- 建立資料表 (依照關聯順序建立)
-- =========================================

-- 1. 建立地點表 (Locations)
CREATE TABLE [dbo].[Locations] (
    [location_id] INT           IDENTITY (1, 1) NOT NULL,
    [country]     NVARCHAR (50) NULL,
    [city]        NVARCHAR (50) NULL,
    [address]     NVARCHAR (50) NULL,
    [phone]       NVARCHAR (50) NULL,
    [longitude]   DECIMAL (18)  NULL,
    [latitude]    DECIMAL (18)  NULL,
    [mrt_info]    NVARCHAR (50) NULL,
    CONSTRAINT [PK_Locations] PRIMARY KEY CLUSTERED ([location_id] ASC)
);
GO

-- 2. 建立空間表 (Spaces) - 依賴 Locations
CREATE TABLE [dbo].[Spaces] (
    [space_id]     INT           IDENTITY (1, 1) NOT NULL,
    [location_id]  INT           NULL,
    [space_number] NVARCHAR (50) NULL,
    [capacity]     INT           NULL,
    [status]       INT           NULL,
    CONSTRAINT [PK_Spaces] PRIMARY KEY CLUSTERED ([space_id] ASC),
    CONSTRAINT [FK_Spaces_Locations] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Locations] ([location_id])
);
GO

-- 3. 建立使用者表 (Users)
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

-- 4. 建立設備表 (equipment)
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

-- 5. 建立空間資產關聯表 (space_asserts)
CREATE TABLE [dbo].[space_asserts] (
    [asserts_id]   INT IDENTITY (1, 1) NOT NULL,
    [space_id]     INT NULL,
    [equipment_id] INT NULL,
    [amount]       INT NULL,
    CONSTRAINT [PK_space_asserts] PRIMARY KEY CLUSTERED ([asserts_id] ASC)
);
GO

-- 6. 建立空間圖片表 (spaceimage)
CREATE TABLE [dbo].[spaceimage] (
    [Id]         INT           IDENTITY (1, 1) NOT NULL,
    [space_id]   INT           NOT NULL,
    [image_path] NVARCHAR (50) NULL,
    CONSTRAINT [PK_spaceimage] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

-- 7. 建立租金表 (rents)
CREATE TABLE [dbo].[rents] (
    [rent_id]    INT          IDENTITY (1, 1) NOT NULL,
    [space_id]   INT          NULL,
    [price_type] INT          NULL,
    [price]      DECIMAL (18) NULL,
    [is_active]  BIT          NULL,
    CONSTRAINT [PK_rents] PRIMARY KEY CLUSTERED ([rent_id] ASC)
);
GO

-- 8. 建立報廢清單 (scrap_list)
CREATE TABLE [dbo].[scrap_list] (
    [scrap_id]     INT           IDENTITY (1, 1) NOT NULL,
    [space_id]     INT           NULL,
    [equipment_id] INT           NULL,
    [amount]       INT           NULL,
    [reason]       NVARCHAR (50) NULL,
    [create_date]  DATETIME      NULL,
    CONSTRAINT [PK_fix_list] PRIMARY KEY CLUSTERED ([scrap_id] ASC)
);
GO

-- 9. 建立員工表 (employees)
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

-- 10. 建立預約/合約表 (booking)
CREATE TABLE [dbo].[booking] (
    [contract_id]        INT           IDENTITY (1, 1) NOT NULL,
    [user_id]            INT           NULL,
    [rent_id]            INT           NULL,
    [employees_id]       INT           NULL,
    [created_date]       DATETIME      NULL,
    [start_date]         DATETIME      NULL,
    [end_date]           DATETIME      NULL,
    [company_name]       NVARCHAR (50) NULL,
    [tax_id]             NVARCHAR (50) NULL,
    [pay_deadline]       DATETIME      NULL,
    [cancelled_daedline] DATETIME      NULL,
    [total_price]        DECIMAL (18)  NULL,
    [status]             INT           NULL,
    CONSTRAINT [PK_Contracts] PRIMARY KEY CLUSTERED ([contract_id] ASC)
);
GO

PRINT '資料庫 coworkingdb 與所有資料表已成功建立完畢！'
GO