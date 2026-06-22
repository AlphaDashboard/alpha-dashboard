-- Table: public.tblVendorSupplier

-- DROP TABLE IF EXISTS public."tblVendorSupplier";

CREATE TABLE IF NOT EXISTS public."tblVendorSupplier"
(
    "VendorSupplierID" bigint NOT NULL,
    "VendorSupplierName" character varying COLLATE pg_catalog."default",
    "Address1" character varying COLLATE pg_catalog."default",
    "Address2" character varying COLLATE pg_catalog."default",
    "ContactNo" character varying COLLATE pg_catalog."default",
    "GSTNo" character varying COLLATE pg_catalog."default",
    "PANo" character(1) COLLATE pg_catalog."default",
    "UserCreted" character varying COLLATE pg_catalog."default",
    "DateCreated" timestamp with time zone,
    "UserModified" character varying COLLATE pg_catalog."default",
    "DateModified" timestamp with time zone,
    CONSTRAINT "tblVendorSupplier_pkey" PRIMARY KEY ("VendorSupplierID")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."tblVendorSupplier"
    OWNER to postgres;