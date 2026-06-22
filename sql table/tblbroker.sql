-- Table: public.tblBroker

-- DROP TABLE IF EXISTS public."tblBroker";

CREATE TABLE IF NOT EXISTS public."tblBroker"
(
    "BrokerID" bigint,
    "BrokerName" character varying COLLATE pg_catalog."default",
    "BrokerAddress" character varying COLLATE pg_catalog."default",
    "ContactNo" character varying COLLATE pg_catalog."default",
    "PANo" character varying COLLATE pg_catalog."default",
    "UserCreated" character varying COLLATE pg_catalog."default",
    "DateCreated" timestamp with time zone,
    "UserModified" character varying COLLATE pg_catalog."default",
    "DateModified" timestamp with time zone
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."tblBroker"
    OWNER to postgres;