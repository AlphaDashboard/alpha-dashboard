import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

sql_migration_and_sp = """
-- 1. Add GrossWeight column to tblsalepurchasechallans_tran if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tblsalepurchasechallans_tran' AND column_name = 'GrossWeight'
    ) THEN
        ALTER TABLE public.tblSalePurchaseChallans_Tran ADD COLUMN "GrossWeight" NUMERIC(18,2) DEFAULT 0;
    END IF;
END $$;

-- 2. Stored Procedure: sp_manage_purchase_challan
CREATE OR REPLACE FUNCTION public.sp_manage_purchase_challan(
    p_operation character varying, 
    p_challan_no character varying DEFAULT NULL::character varying, 
    p_challan_date date DEFAULT NULL::date, 
    p_tran_type character varying DEFAULT 'RMPCH'::character varying, 
    p_gp_no integer DEFAULT NULL::integer, 
    p_status_id integer DEFAULT 1, 
    p_po_no character varying DEFAULT NULL::character varying, 
    p_po_date date DEFAULT NULL::date, 
    p_username character varying DEFAULT 'system'::character varying, 
    p_tran_items text DEFAULT '[]'::text
)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_challan_no    VARCHAR(50);
    v_item          JSONB;
    v_items         JSONB;
    v_seq           INTEGER;
    v_today         TEXT;
    
    -- Local variables for gate pass info lookup
    v_gp_date       DATE         := NULL;
    v_veh_no        VARCHAR(50)  := NULL;
    v_dr_name       VARCHAR(100) := NULL;
    v_weigh_no      VARCHAR(50)  := NULL;
    v_weigh_date    DATE         := NULL;
    v_bags          NUMERIC(18,2):= 0;
    v_gross         NUMERIC(18,2):= 0;
    v_tare          NUMERIC(18,2):= 0;
    v_net           NUMERIC(18,2):= 0;
BEGIN
    v_items := p_tran_items::JSONB;

    -- Lookup gate pass info if GPNo is provided
    IF p_gp_no IS NOT NULL THEN
        SELECT "GatePassdate", "VehicleNo", "DriverName", "WeighmentNo", "WeighmentDate", "Bags", "GrossWeight", "TareWeight", "NetWeight"
          INTO v_gp_date, v_veh_no, v_dr_name, v_weigh_no, v_weigh_date, v_bags, v_gross, v_tare, v_net
          FROM public."tblGatePass"
         WHERE "GatePassNo" = p_gp_no;
    END IF;

    -- ── INSERT ──────────────────────────────────────────────────────────────
    IF p_operation = 'INSERT' THEN

        -- Auto-generate ChallanNo if blank: PC-YYYYMMDD-NNNN
        IF p_challan_no IS NULL OR p_challan_no = '' THEN
            v_today := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
            SELECT COALESCE(MAX(CAST(SPLIT_PART("ChallanNo", '-', 3) AS INTEGER)), 0) + 1
              INTO v_seq
              FROM public.tblSalePurchaseChallans
             WHERE "ChallanNo" LIKE 'PC-' || v_today || '-%';
            v_challan_no := 'PC-' || v_today || '-' || LPAD(v_seq::TEXT, 4, '0');
        ELSE
            v_challan_no := p_challan_no;
        END IF;

        INSERT INTO public.tblSalePurchaseChallans (
            "ChallanNo", "ChallanDate", "TranType", "GPNo", "StatusId",
            "PONO", "PODate", "GatePassDate", "VehicleNo", "DriverName",
            "WeighmentSlipNo", "WeighmentDate", "Bags", "GrossWeight", "TareWeight", "NetWeight",
            "draftedby", "DraftedDate"
        ) VALUES (
            v_challan_no, p_challan_date, p_tran_type, p_gp_no, p_status_id,
            p_po_no, p_po_date, v_gp_date, v_veh_no, v_dr_name,
            v_weigh_no, v_weigh_date, v_bags, v_gross, v_tare, v_net,
            p_username, NOW()
        );

        -- Insert material rows
        FOR v_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(v_items)
        LOOP
            INSERT INTO public.tblSalePurchaseChallans_Tran (
                "ChallanNo", "MaterialID", "Bags", "GrossWeight", "NetWeight", "Remarks"
            ) VALUES (
                v_challan_no,
                NULLIF((v_item->>'MaterialID'), '')::INTEGER,
                COALESCE((v_item->>'Bags')::NUMERIC, 0),
                COALESCE((v_item->>'GrossWeight')::NUMERIC, 0),
                COALESCE((v_item->>'NetWeight')::NUMERIC, 0),
                COALESCE(v_item->>'Remarks', '')
            );
        END LOOP;

        RETURN v_challan_no;

    -- ── UPDATE ──────────────────────────────────────────────────────────────
    ELSIF p_operation = 'UPDATE' THEN
        v_challan_no := p_challan_no;

        UPDATE public.tblSalePurchaseChallans SET
            "ChallanDate"     = p_challan_date,
            "TranType"        = p_tran_type,
            "GPNo"            = p_gp_no,
            "StatusId"        = p_status_id,
            "PONO"            = p_po_no,
            "PODate"          = p_po_date,
            "GatePassDate"    = v_gp_date,
            "VehicleNo"       = v_veh_no,
            "DriverName"      = v_dr_name,
            "WeighmentSlipNo" = v_weigh_no,
            "WeighmentDate"   = v_weigh_date,
            "Bags"            = v_bags,
            "GrossWeight"     = v_gross,
            "TareWeight"      = v_tare,
            "NetWeight"       = v_net,
            "submittedby"     = CASE WHEN p_status_id = 2 AND "submittedby" IS NULL THEN p_username ELSE "submittedby" END,
            "SubmissionDate"  = CASE WHEN p_status_id = 2 AND "SubmissionDate" IS NULL THEN NOW() ELSE "SubmissionDate" END,
            "approvedby"      = CASE WHEN p_status_id = 4 THEN p_username ELSE "approvedby" END,
            "ApprovalDate"    = CASE WHEN p_status_id = 4 THEN NOW() ELSE "ApprovalDate" END
        WHERE "ChallanNo" = v_challan_no;

        -- Replace all tran rows
        DELETE FROM public.tblSalePurchaseChallans_Tran WHERE "ChallanNo" = v_challan_no;

        FOR v_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(v_items)
        LOOP
            INSERT INTO public.tblSalePurchaseChallans_Tran (
                "ChallanNo", "MaterialID", "Bags", "GrossWeight", "NetWeight", "Remarks"
            ) VALUES (
                v_challan_no,
                NULLIF((v_item->>'MaterialID'), '')::INTEGER,
                COALESCE((v_item->>'Bags')::NUMERIC, 0),
                COALESCE((v_item->>'GrossWeight')::NUMERIC, 0),
                COALESCE((v_item->>'NetWeight')::NUMERIC, 0),
                COALESCE(v_item->>'Remarks', '')
            );
        END LOOP;

        RETURN v_challan_no;

    -- ── DELETE ──────────────────────────────────────────────────────────────
    ELSIF p_operation = 'DELETE' THEN
        v_challan_no := p_challan_no;
        DELETE FROM public.tblSalePurchaseChallans_Tran WHERE "ChallanNo" = v_challan_no;
        DELETE FROM public.tblSalePurchaseChallans WHERE "ChallanNo" = v_challan_no;
        RETURN v_challan_no;
    END IF;

    RETURN NULL;
END;
$function$;
"""

if __name__ == '__main__':
    print("Executing Stored Procedure and Schema update on database...")
    with connection.cursor() as cursor:
        cursor.execute(sql_migration_and_sp)
    print("SUCCESS: Stored Procedure sp_manage_purchase_challan and GrossWeight column successfully updated on the database!")
