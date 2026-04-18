-- =========================================
-- 專案：共享辦公室租賃系統 
-- =========================================

-- 1. 建立 Locations (房地產據點表)
CREATE TABLE [dbo].[Locations] (
    [location_id]   INT           IDENTITY (1, 1) NOT NULL,
    [country]       NVARCHAR (50) NULL,
    [city]          NVARCHAR (50) NULL,
    [building_name] NVARCHAR (50) NULL,
    [address]       NVARCHAR (50) NULL,
    CONSTRAINT [PK_Locations] PRIMARY KEY CLUSTERED ([location_id] ASC)
);
GO

-- 2. 建立 Spaces (空間/辦公室表)
CREATE TABLE [dbo].[Spaces] (
    [space_id]     INT           IDENTITY (1, 1) NOT NULL,
    [location_id]  INT           NULL,
    [space_number] NVARCHAR (50) NULL,
    [capacity]     INT           NULL,
    [rent]         DECIMAL (18)  NULL,
    [is_rented]    BIT           CONSTRAINT [DEFAULT_Spaces_is_rented] DEFAULT ((0)) NULL,
    CONSTRAINT [PK_Spaces] PRIMARY KEY CLUSTERED ([space_id] ASC),
    
    
    CONSTRAINT [FK_Spaces_Locations] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Locations] ([location_id])
);
GO

-- 3. 建立 Companies (租戶/公司表)
CREATE TABLE [dbo].[Companies] (
    [company_id]    INT           IDENTITY (1, 1) NOT NULL,
    [company_name]  NVARCHAR (50) NULL,
    [tax_id]        NVARCHAR (50) NULL,
    [contact_name]  NVARCHAR (50) NULL,
    [contact_phone] NVARCHAR (50) NULL,
    [contact_email] NVARCHAR (50) NULL,
    CONSTRAINT [PK_Companies] PRIMARY KEY CLUSTERED ([company_id] ASC)
);
GO

-- 4. 建立 Contracts (租賃合約表)
CREATE TABLE [dbo].[Contracts] (
    [contract_id] INT          IDENTITY (1, 1) NOT NULL,
    [company_id]  INT          NULL,
    [space_id]    INT          NULL,
    [start_date]  DATETIME     NULL,
    [end_date]    DATETIME     NULL,
    [deposit]     DECIMAL (18) NULL,
    [is_active]   BIT          CONSTRAINT [DEFAULT_Contracts_is_active] DEFAULT ((1)) NULL,
    CONSTRAINT [PK_Contracts] PRIMARY KEY CLUSTERED ([contract_id] ASC),
    
    
    CONSTRAINT [FK_Contracts_Companies] FOREIGN KEY ([company_id]) REFERENCES [dbo].[Companies] ([company_id]),
    CONSTRAINT [FK_Contracts_Spaces] FOREIGN KEY ([space_id]) REFERENCES [dbo].[Spaces] ([space_id])
);
GO
