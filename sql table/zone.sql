-- Table: public.tblZone

-- DROP TABLE IF EXISTS public."tblZone";

CREATE TABLE IF NOT EXISTS public."tblZone"
(
    "ZoneID" bigint NOT NULL,
    "ZoneName" character varying COLLATE pg_catalog."default",
    "UserCreated" character varying COLLATE pg_catalog."default",
    "DateCreated" timestamp with time zone,
    "UserModified" character varying COLLATE pg_catalog."default",
    "DateModified" timestamp with time zone,
    CONSTRAINT "tblZone_pkey" PRIMARY KEY ("ZoneID")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."tblZone"
    OWNER to postgres;