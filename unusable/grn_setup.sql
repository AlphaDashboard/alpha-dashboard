-- =========================================================================
-- GATE PASS SCHEMAS AND DATA RESTORATION
-- =========================================================================

CREATE TABLE IF NOT EXISTS public."tblGatePass" (
    "GatePassNo"     INTEGER NOT NULL PRIMARY KEY,
    "GatePassdate"   DATE NULL,
    "VehicleNo"      VARCHAR(50) NULL,
    "DriverName"     VARCHAR(100) NULL,
    "WeighmentNo"    VARCHAR(50) NULL,
    "WeighmentDate"  DATE NULL,
    "Bags"           NUMERIC(18,2) NULL,
    "GrossWeight"    NUMERIC(18,2) NULL,
    "TareWeight"     NUMERIC(18,2) NULL,
    "NetWeight"      NUMERIC(18,2) NULL
);
ALTER TABLE public."tblGatePass" OWNER TO alpha_user;

CREATE TABLE IF NOT EXISTS public."tblGatePass_Tran" (
    "ID"             SERIAL NOT NULL PRIMARY KEY,
    "GatePassNo"     INTEGER NULL,
    "GatePassDate"   DATE NULL,
    "MaterialID"     INTEGER NULL,
    "Bags"           NUMERIC(18,2) NULL,
    "GrossWeight"    NUMERIC(18,2) NULL,
    "NetWeight"      NUMERIC(18,2) NULL
);
ALTER TABLE public."tblGatePass_Tran" OWNER TO alpha_user;

-- Populate tblMaterial with Maize and Gram if they don't exist
INSERT INTO public."tblMaterial" (id, "material_code", "material_name", "is_active")
VALUES (12, 'M-008', 'Maize', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."tblMaterial" (id, "material_code", "material_name", "is_active")
VALUES (13, 'M-009', 'Gram', true)
ON CONFLICT (id) DO NOTHING;

-- Populate tblGatePass rows
DELETE FROM public."tblGatePass_Tran";
DELETE FROM public."tblGatePass";

INSERT INTO public."tblGatePass" ("GatePassNo", "GatePassdate", "VehicleNo", "DriverName", "WeighmentNo", "WeighmentDate", "Bags", "GrossWeight", "TareWeight", "NetWeight") VALUES
(1, '2026-06-01', 'KA01/1234', 'Ram', '12', '2026-03-01', 100, 123, 23, 100),
(2, '2026-04-02', 'KA00/1234', 'Shyam', '23', '2026-03-02', 101, 134, 34, 100),
(3, '2026-06-01', 'HR09', 'Mohan', '4', '2026-03-03', 98, 212, 33, 179),
(4, '2026-06-01', 'DL06', 'Kamal', '5', '2026-03-04', 102, 334, 25, 309),
(5, '2026-06-01', 'PB25/2300', 'Aman', '5', '2026-03-05', 104, 334, 32, 302),
(6, '2026-06-01', 'KA00/098', 'Raman', '23', '2026-03-06', 101, 221, 35, 186),
(7, '2026-06-01', 'KL03/234', 'Kamat', '21', '2026-03-07', 102, 234, 32, 202);

-- Populate tblGatePass_Tran rows
INSERT INTO public."tblGatePass_Tran" ("GatePassNo", "GatePassDate", "MaterialID", "Bags", "GrossWeight", "NetWeight") VALUES
(1, '2026-06-01', 1, 20, 12, 11),
(2, '2026-04-02', 12, 50, 21, 21),
(3, '2026-06-01', 1, 40, 23, 23),
(4, '2026-06-01', 1, 20, 45, 45),
(5, '2026-06-01', 1, 30, 43, 43),
(6, '2026-06-01', 13, 40, 34, 33),
(7, '2026-06-01', 3, 30, 32, 31);


-- =========================================================================
-- GRN MODULE POSTGRESQL SETUP SCRIPT
-- =========================================================================

-- 1. Create main GRN Header table (tblGRN)
CREATE TABLE IF NOT EXISTS public."tblGRN" (
    "GrnNo"             VARCHAR(50)     NOT NULL PRIMARY KEY,
    "GrnDate"           TIMESTAMP       NULL,
    "GatepassNo"        INTEGER         NULL,
    "Netweight"         NUMERIC(18,2)   NULL,
    "DeductedWeight"    NUMERIC(18,2)   NULL,
    "Approvedweight"    NUMERIC(18,2)   NULL,
    "status"            INTEGER         NULL,
    "internalnotes"     VARCHAR(500)    NULL,
    "draftedby"         VARCHAR(100)    NULL,
    "DraftedDate"       TIMESTAMP       NULL,
    "submittedby"       VARCHAR(100)    NULL,
    "SubmissionDate"    TIMESTAMP       NULL,
    "referedbackby"     VARCHAR(100)    NULL,
    "Referredbackdate"  TIMESTAMP       NULL,
    "approvedby"        VARCHAR(100)    NULL,
    "ApprovalDate"      TIMESTAMP       NULL
);

ALTER TABLE public."tblGRN" OWNER TO alpha_user;

-- 2. Create Material Transaction Detail rows table (tblGRN_TRAN_MAT)
CREATE TABLE IF NOT EXISTS public."tblGRN_TRAN_MAT" (
    "ID"            SERIAL          NOT NULL PRIMARY KEY,
    "GrnNo"         VARCHAR(50)     NULL,
    "GrnDate"       TIMESTAMP       NULL,
    "MaterialID"    INTEGER         NULL,
    "Bags"          NUMERIC(18,2)   NULL,
    "Grossweight"   NUMERIC(18,2)   NULL,
    "Netweight"     NUMERIC(18,2)   NULL,
    "Remarks"       VARCHAR(500)    NULL,
    "usercreated"   VARCHAR(100)    NULL,
    "usermodified"  VARCHAR(100)    NULL,
    "datecreated"   TIMESTAMP       NULL DEFAULT NOW(),
    "datemodified"  TIMESTAMP       NULL DEFAULT NOW(),

    CONSTRAINT "FK_GRN_MAT_GrnNo"
        FOREIGN KEY ("GrnNo")
        REFERENCES public."tblGRN"("GrnNo")
        ON DELETE CASCADE
);

ALTER TABLE public."tblGRN_TRAN_MAT" OWNER TO alpha_user;

-- 3. Create Test Result Detail rows table (tblGRN_TRAN_TEST)
CREATE TABLE IF NOT EXISTS public."tblGRN_TRAN_TEST" (
    "ID"             SERIAL          NOT NULL PRIMARY KEY,
    "GrnNo"          VARCHAR(50)     NULL,
    "GrnDate"        TIMESTAMP       NULL,
    "TestID"         INTEGER         NULL,
    "Testmethodid"   INTEGER         NULL,
    "Testresult"     NUMERIC(18,2)   NULL,
    "deductedweight" NUMERIC(18,2)   NULL,
    "Remarks"        VARCHAR(500)    NULL,

    CONSTRAINT "FK_GRN_TEST_GrnNo"
        FOREIGN KEY ("GrnNo")
        REFERENCES public."tblGRN"("GrnNo")
        ON DELETE CASCADE
);

ALTER TABLE public."tblGRN_TRAN_TEST" OWNER TO alpha_user;

-- 4. Create or replace stored procedure (sp_manage_grn)
CREATE OR REPLACE PROCEDURE public.sp_manage_grn(
    p_operation         VARCHAR(20),
    p_grn_no            VARCHAR(50)   DEFAULT NULL,
    p_grn_date          TIMESTAMP     DEFAULT NULL,
    p_gatepass_no       INTEGER       DEFAULT NULL,
    p_netweight         NUMERIC(18,2) DEFAULT NULL,
    p_deducted_weight   NUMERIC(18,2) DEFAULT NULL,
    p_approved_weight   NUMERIC(18,2) DEFAULT NULL,
    p_status            INTEGER       DEFAULT NULL,
    p_internal_notes    VARCHAR(500)  DEFAULT NULL,
    p_drafted_by        VARCHAR(100)  DEFAULT NULL,
    p_drafted_date      TIMESTAMP     DEFAULT NULL,
    p_submitted_by      VARCHAR(100)  DEFAULT NULL,
    p_submission_date   TIMESTAMP     DEFAULT NULL,
    p_referred_back_by  VARCHAR(100)  DEFAULT NULL,
    p_referred_back_date TIMESTAMP    DEFAULT NULL,
    p_approved_by       VARCHAR(100)  DEFAULT NULL,
    p_approval_date     TIMESTAMP     DEFAULT NULL,
    p_username          VARCHAR(100)  DEFAULT NULL,
    p_mat_items         TEXT          DEFAULT '[]',
    p_test_items        TEXT          DEFAULT '[]'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_mat_item  JSONB;
    v_test_item JSONB;
BEGIN

    -- ─────────────────────────────────────────────────────────────────────────
    -- INSERT
    -- ─────────────────────────────────────────────────────────────────────────
    IF p_operation = 'INSERT' THEN

        INSERT INTO public."tblGRN" (
            "GrnNo", "GrnDate", "GatepassNo",
            "Netweight", "DeductedWeight", "Approvedweight",
            "status", "internalnotes",
            "draftedby", "DraftedDate"
        )
        VALUES (
            p_grn_no, p_grn_date, p_gatepass_no,
            p_netweight, p_deducted_weight, p_approved_weight,
            p_status, p_internal_notes,
            p_username, NOW()
        );

        -- Insert material rows from JSON array
        FOR v_mat_item IN SELECT * FROM jsonb_array_elements(p_mat_items::jsonb)
        LOOP
            INSERT INTO public."tblGRN_TRAN_MAT" (
                "GrnNo", "GrnDate",
                "MaterialID", "Bags", "Grossweight", "Netweight",
                "Remarks", "usercreated", "datecreated"
            )
            VALUES (
                p_grn_no,
                p_grn_date,
                (v_mat_item->>'MaterialID')::INTEGER,
                (v_mat_item->>'Bags')::NUMERIC,
                (v_mat_item->>'Grossweight')::NUMERIC,
                (v_mat_item->>'Netweight')::NUMERIC,
                v_mat_item->>'Remarks',
                p_username,
                NOW()
            );
        END LOOP;

        -- Insert test rows from JSON array
        FOR v_test_item IN SELECT * FROM jsonb_array_elements(p_test_items::jsonb)
        LOOP
            INSERT INTO public."tblGRN_TRAN_TEST" (
                "GrnNo", "GrnDate",
                "TestID", "Testmethodid",
                "Testresult", "deductedweight", "Remarks"
            )
            VALUES (
                p_grn_no,
                p_grn_date,
                (v_test_item->>'TestID')::INTEGER,
                (v_test_item->>'Testmethodid')::INTEGER,
                (v_test_item->>'Testresult')::NUMERIC,
                (v_test_item->>'deductedweight')::NUMERIC,
                v_test_item->>'Remarks'
            );
        END LOOP;

    -- ─────────────────────────────────────────────────────────────────────────
    -- UPDATE
    -- ─────────────────────────────────────────────────────────────────────────
    ELSIF p_operation = 'UPDATE' THEN

        UPDATE public."tblGRN" SET
            "GrnDate"          = p_grn_date,
            "GatepassNo"       = p_gatepass_no,
            "Netweight"        = p_netweight,
            "DeductedWeight"   = p_deducted_weight,
            "Approvedweight"   = p_approved_weight,
            "status"           = p_status,
            "internalnotes"    = p_internal_notes,
            "submittedby"      = p_submitted_by,
            "SubmissionDate"   = p_submission_date,
            "referedbackby"    = p_referred_back_by,
            "Referredbackdate" = p_referred_back_date,
            "approvedby"       = p_approved_by,
            "ApprovalDate"     = p_approval_date
        WHERE "GrnNo" = p_grn_no;

        -- Delete old detail rows, re-insert fresh
        DELETE FROM public."tblGRN_TRAN_MAT"  WHERE "GrnNo" = p_grn_no;
        DELETE FROM public."tblGRN_TRAN_TEST" WHERE "GrnNo" = p_grn_no;

        FOR v_mat_item IN SELECT * FROM jsonb_array_elements(p_mat_items::jsonb)
        LOOP
            INSERT INTO public."tblGRN_TRAN_MAT" (
                "GrnNo", "GrnDate",
                "MaterialID", "Bags", "Grossweight", "Netweight",
                "Remarks", "usermodified", "datemodified"
            )
            VALUES (
                p_grn_no, p_grn_date,
                (v_mat_item->>'MaterialID')::INTEGER,
                (v_mat_item->>'Bags')::NUMERIC,
                (v_mat_item->>'Grossweight')::NUMERIC,
                (v_mat_item->>'Netweight')::NUMERIC,
                v_mat_item->>'Remarks',
                p_username, NOW()
            );
        END LOOP;

        FOR v_test_item IN SELECT * FROM jsonb_array_elements(p_test_items::jsonb)
        LOOP
            INSERT INTO public."tblGRN_TRAN_TEST" (
                "GrnNo", "GrnDate",
                "TestID", "Testmethodid",
                "Testresult", "deductedweight", "Remarks"
            )
            VALUES (
                p_grn_no, p_grn_date,
                (v_test_item->>'TestID')::INTEGER,
                (v_test_item->>'Testmethodid')::INTEGER,
                (v_test_item->>'Testresult')::NUMERIC,
                (v_test_item->>'deductedweight')::NUMERIC,
                v_test_item->>'Remarks'
            );
        END LOOP;

    -- ─────────────────────────────────────────────────────────────────────────
    -- DELETE
    -- ─────────────────────────────────────────────────────────────────────────
    ELSIF p_operation = 'DELETE' THEN

        DELETE FROM public."tblGRN_TRAN_MAT"  WHERE "GrnNo" = p_grn_no;
        DELETE FROM public."tblGRN_TRAN_TEST" WHERE "GrnNo" = p_grn_no;
        DELETE FROM public."tblGRN"           WHERE "GrnNo" = p_grn_no;

    END IF;

END;
$$;

ALTER PROCEDURE public.sp_manage_grn(character varying, character varying, timestamp without time zone, integer, numeric, numeric, numeric, integer, character varying, character varying, timestamp without time zone, character varying, timestamp without time zone, character varying, timestamp without time zone, character varying, timestamp without time zone, character varying, text, text) OWNER TO alpha_user;
