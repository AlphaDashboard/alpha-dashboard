--
-- PostgreSQL database dump
--

\restrict 3WRE6YXtrTBUj9o1S39584tgDIYeAUamGy16DddhJQMMsJgqdJ1g5n1oqgrUn2E

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS "tblSubsectionB2_TRAN_accountmaster_id_32d54d31_fk_tblAccoun";
ALTER TABLE IF EXISTS ONLY public."tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS "tblSubsectionB2_TRAN_VoucherNo_19ef3ff2_fk_tblSubsec";
ALTER TABLE IF EXISTS ONLY public."tblSubsectionB2" DROP CONSTRAINT IF EXISTS "tblSubsectionB2_BankAccount_ba779399_fk_tblAlphagroup_id";
ALTER TABLE IF EXISTS ONLY public."tblSectionC_TRAN" DROP CONSTRAINT IF EXISTS "tblSectionC_TRAN_accountmaster_id_897e3b72_fk_tblAccoun";
ALTER TABLE IF EXISTS ONLY public."tblSectionC_TRAN" DROP CONSTRAINT IF EXISTS "tblSectionC_TRAN_VoucherNo_dad46454_fk_tblSectionC_voucher_no";
ALTER TABLE IF EXISTS ONLY public."tblSectionC" DROP CONSTRAINT IF EXISTS "tblSectionC_BankAccount_246fc912_fk_tblAlphagroup_id";
ALTER TABLE IF EXISTS ONLY public."tblSalPurGroup_Tran" DROP CONSTRAINT IF EXISTS "tblSalPurGroup_Tran_SalPurGroupID_b11a8d7e_fk_tblSalPur";
ALTER TABLE IF EXISTS ONLY public."tblSalPurGroup_Tran" DROP CONSTRAINT IF EXISTS "tblSalPurGroup_Tran_ChargeAccountID_009807f3_fk_tblAccoun";
ALTER TABLE IF EXISTS ONLY public."tblSalPurGroup" DROP CONSTRAINT IF EXISTS "tblSalPurGroup_GroupwiseAccountID_be613f5b_fk_tblAccoun";
ALTER TABLE IF EXISTS ONLY public."tblPurchaseOrder_TRAN" DROP CONSTRAINT IF EXISTS "tblPurchaseOrder_TRAN_item_id_15398968_fk_tblMaterial_id";
ALTER TABLE IF EXISTS ONLY public."tblPurchaseOrder_TRAN" DROP CONSTRAINT IF EXISTS "tblPurchaseOrder_TRAN_PONo_befb3715_fk_tblPurchaseOrder_po_no";
ALTER TABLE IF EXISTS ONLY public."tblGateEntry" DROP CONSTRAINT IF EXISTS "tblGateEntry_supplier_id_c0aed273_fk_tblAlphagroup_id";
ALTER TABLE IF EXISTS ONLY public."tblGateEntry" DROP CONSTRAINT IF EXISTS "tblGateEntry_created_by_id_3e403935_fk_auth_user_id";
ALTER TABLE IF EXISTS ONLY public."tblCASHBANK_TRAN" DROP CONSTRAINT IF EXISTS "tblCASHBANK_TRAN_accountmaster_id_168e0a25_fk_tblAccoun";
ALTER TABLE IF EXISTS ONLY public."tblCASHBANK_TRAN" DROP CONSTRAINT IF EXISTS "tblCASHBANK_TRAN_VoucherNo_7383c4d9_fk_tblCASHBANK_voucher_no";
ALTER TABLE IF EXISTS ONLY public."tblCASHBANK" DROP CONSTRAINT IF EXISTS "tblCASHBANK_BankAccount_0d90bc6d_fk_tblAlphagroup_id";
ALTER TABLE IF EXISTS ONLY public."tblAccountmaster" DROP CONSTRAINT IF EXISTS "tblAlphagroup_categoryID_55217ceb_fk";
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_user_id_c564eba6_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_content_type_id_c4bce8eb_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.dashboard_voucherfact DROP CONSTRAINT IF EXISTS dashboard_voucherfact_voucher_id_e280e456_fk;
ALTER TABLE IF EXISTS ONLY public.dashboard_voucherfact DROP CONSTRAINT IF EXISTS dashboard_voucherfact_alpha_group_id_d1ae66c5_fk;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_user_id_6a12ed8b_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_group_id_97559544_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_2f476e4b_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
DROP TRIGGER IF EXISTS trg_verify_b2_header_lock ON public."tblSubsectionB2";
DROP TRIGGER IF EXISTS trg_verify_b2_detail_lock ON public."tblSubsectionB2_TRAN";
DROP INDEX IF EXISTS public."tblUserMaster_user_id_a7f49b2d_like";
DROP INDEX IF EXISTS public."tblUserMaster_empid_a77ccf58_like";
DROP INDEX IF EXISTS public."tblSubsectionB2_voucher_no_5ca41d3e_like";
DROP INDEX IF EXISTS public."tblSubsectionB2_TRAN_alpha_group_id_fcd832e7";
DROP INDEX IF EXISTS public."tblSubsectionB2_TRAN_VoucherNo_19ef3ff2_like";
DROP INDEX IF EXISTS public."tblSubsectionB2_TRAN_VoucherNo_19ef3ff2";
DROP INDEX IF EXISTS public."tblSubsectionB2_BankAccount_ba779399";
DROP INDEX IF EXISTS public."tblSectionC_voucher_no_42931d10_like";
DROP INDEX IF EXISTS public."tblSectionC_TRAN_alpha_group_id_288509e3";
DROP INDEX IF EXISTS public."tblSectionC_TRAN_VoucherNo_dad46454_like";
DROP INDEX IF EXISTS public."tblSectionC_TRAN_VoucherNo_dad46454";
DROP INDEX IF EXISTS public."tblSectionC_BankAccount_246fc912";
DROP INDEX IF EXISTS public."tblSalPurGroup_Tran_SalPurGroupID_b11a8d7e";
DROP INDEX IF EXISTS public."tblSalPurGroup_Tran_ChargeAccountID_009807f3";
DROP INDEX IF EXISTS public."tblSalPurGroup_GroupwiseAccountID_be613f5b";
DROP INDEX IF EXISTS public."tblPurchaseOrder_supplier_id_0312ed54";
DROP INDEX IF EXISTS public."tblPurchaseOrder_po_no_8c945f8c_like";
DROP INDEX IF EXISTS public."tblPurchaseOrder_broker_id_afdaf2ce";
DROP INDEX IF EXISTS public."tblPurchaseOrder_TRAN_item_id_15398968";
DROP INDEX IF EXISTS public."tblPurchaseOrder_TRAN_PONo_befb3715_like";
DROP INDEX IF EXISTS public."tblPurchaseOrder_TRAN_PONo_befb3715";
DROP INDEX IF EXISTS public."tblPurchaseOrder_SalPurGroupID_10151954";
DROP INDEX IF EXISTS public."tblGateEntry_supplier_id_c0aed273";
DROP INDEX IF EXISTS public."tblGateEntry_material_type_id_ea157c65";
DROP INDEX IF EXISTS public."tblGateEntry_gate_pass_id_fdf3eb6b_like";
DROP INDEX IF EXISTS public."tblGateEntry_created_by_id_3e403935";
DROP INDEX IF EXISTS public."tblCASHBANK_voucher_no_7a22c4b3_like";
DROP INDEX IF EXISTS public."tblCASHBANK_module_type_3b97e142_like";
DROP INDEX IF EXISTS public."tblCASHBANK_module_type_3b97e142";
DROP INDEX IF EXISTS public."tblCASHBANK_TRAN_alpha_group_id_e026af4a";
DROP INDEX IF EXISTS public."tblCASHBANK_TRAN_VoucherNo_7383c4d9_like";
DROP INDEX IF EXISTS public."tblCASHBANK_TRAN_VoucherNo_7383c4d9";
DROP INDEX IF EXISTS public."tblCASHBANK_BankAccount_0d90bc6d";
DROP INDEX IF EXISTS public."tblAlphagroup_categoryID_55217ceb";
DROP INDEX IF EXISTS public.idx_b2_tran_voucherno;
DROP INDEX IF EXISTS public.idx_b2_tran_reporting;
DROP INDEX IF EXISTS public.idx_b2_reporting_composite;
DROP INDEX IF EXISTS public.idx_b2_cost_center_partial;
DROP INDEX IF EXISTS public.idx_b2_chq_no_partial;
DROP INDEX IF EXISTS public.django_session_session_key_c0390e0f_like;
DROP INDEX IF EXISTS public.django_session_expire_date_a5c62663;
DROP INDEX IF EXISTS public.django_admin_log_user_id_c564eba6;
DROP INDEX IF EXISTS public.django_admin_log_content_type_id_c4bce8eb;
DROP INDEX IF EXISTS public.dashboard_voucherfact_voucher_id_e280e456;
DROP INDEX IF EXISTS public.dashboard_voucherfact_alpha_group_id_d1ae66c5;
DROP INDEX IF EXISTS public.dashboard_voucher_voucher_number_300b02ea_like;
DROP INDEX IF EXISTS public.auth_user_username_6821ab7c_like;
DROP INDEX IF EXISTS public.auth_user_user_permissions_user_id_a95ead1b;
DROP INDEX IF EXISTS public.auth_user_user_permissions_permission_id_1fbb5f2c;
DROP INDEX IF EXISTS public.auth_user_groups_user_id_6a12ed8b;
DROP INDEX IF EXISTS public.auth_user_groups_group_id_97559544;
DROP INDEX IF EXISTS public.auth_permission_content_type_id_2f476e4b;
DROP INDEX IF EXISTS public.auth_group_permissions_permission_id_84c5c92e;
DROP INDEX IF EXISTS public.auth_group_permissions_group_id_b120cbf9;
DROP INDEX IF EXISTS public.auth_group_name_a6ea08ec_like;
ALTER TABLE IF EXISTS ONLY public."tblZone" DROP CONSTRAINT IF EXISTS "tblZone_pkey";
ALTER TABLE IF EXISTS ONLY public."tblVendorSupplier" DROP CONSTRAINT IF EXISTS "tblVendorSupplier_pkey";
ALTER TABLE IF EXISTS ONLY public."tblUserMaster" DROP CONSTRAINT IF EXISTS "tblUserMaster_pkey";
ALTER TABLE IF EXISTS ONLY public."tblUserMaster" DROP CONSTRAINT IF EXISTS "tblUserMaster_empid_key";
ALTER TABLE IF EXISTS ONLY public."tblSubsectionB2" DROP CONSTRAINT IF EXISTS "tblSubsectionB2_pkey";
ALTER TABLE IF EXISTS ONLY public."tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS "tblSubsectionB2_TRAN_pkey";
ALTER TABLE IF EXISTS ONLY public."tblSectionC" DROP CONSTRAINT IF EXISTS "tblSectionC_pkey";
ALTER TABLE IF EXISTS ONLY public."tblSectionC_TRAN" DROP CONSTRAINT IF EXISTS "tblSectionC_TRAN_pkey";
ALTER TABLE IF EXISTS ONLY public."tblSalPurGroup" DROP CONSTRAINT IF EXISTS "tblSalPurGroup_pkey";
ALTER TABLE IF EXISTS ONLY public."tblSalPurGroup_Tran" DROP CONSTRAINT IF EXISTS "tblSalPurGroup_Tran_pkey";
ALTER TABLE IF EXISTS ONLY public."tblPurchaseOrder" DROP CONSTRAINT IF EXISTS "tblPurchaseOrder_pkey";
ALTER TABLE IF EXISTS ONLY public."tblPurchaseOrder_TRAN" DROP CONSTRAINT IF EXISTS "tblPurchaseOrder_TRAN_pkey";
ALTER TABLE IF EXISTS ONLY public."tblPurSales" DROP CONSTRAINT IF EXISTS "tblPurSales_pkey";
ALTER TABLE IF EXISTS ONLY public."tblPurSales_Tran" DROP CONSTRAINT IF EXISTS "tblPurSales_Tran_pkey";
ALTER TABLE IF EXISTS ONLY public."tblMaterial" DROP CONSTRAINT IF EXISTS "tblMaterial_pkey";
ALTER TABLE IF EXISTS ONLY public."tblMaterial" DROP CONSTRAINT IF EXISTS "tblMaterial_material_code_key";
ALTER TABLE IF EXISTS ONLY public."tblGateEntry" DROP CONSTRAINT IF EXISTS "tblGateEntry_pkey";
ALTER TABLE IF EXISTS ONLY public."tblGateEntry" DROP CONSTRAINT IF EXISTS "tblGateEntry_gate_pass_id_key";
ALTER TABLE IF EXISTS ONLY public."tblCategory" DROP CONSTRAINT IF EXISTS "tblCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."tblCASHBANK" DROP CONSTRAINT IF EXISTS "tblCASHBANK_pkey";
ALTER TABLE IF EXISTS ONLY public."tblCASHBANK_TRAN" DROP CONSTRAINT IF EXISTS "tblCASHBANK_TRAN_pkey";
ALTER TABLE IF EXISTS ONLY public."tblAccountmaster" DROP CONSTRAINT IF EXISTS "tblAlphagroup_pkey";
ALTER TABLE IF EXISTS ONLY public.django_session DROP CONSTRAINT IF EXISTS django_session_pkey;
ALTER TABLE IF EXISTS ONLY public.django_migrations DROP CONSTRAINT IF EXISTS django_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_app_label_model_76bd3d3b_uniq;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_pkey;
ALTER TABLE IF EXISTS ONLY public.dashboard_voucherfact DROP CONSTRAINT IF EXISTS dashboard_voucherfact_pkey;
ALTER TABLE IF EXISTS ONLY public.dashboard_voucher DROP CONSTRAINT IF EXISTS dashboard_voucher_voucher_number_key;
ALTER TABLE IF EXISTS ONLY public.dashboard_voucher DROP CONSTRAINT IF EXISTS dashboard_voucher_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user DROP CONSTRAINT IF EXISTS auth_user_username_key;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_user_id_permission_id_14a6b632_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user DROP CONSTRAINT IF EXISTS auth_user_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_user_id_group_id_94350c0c_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_codename_01ab375a_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_name_key;
DROP TABLE IF EXISTS public."tblZone";
DROP TABLE IF EXISTS public."tblVendorSupplier";
DROP TABLE IF EXISTS public."tblUserMaster";
DROP TABLE IF EXISTS public."tblSubsectionB2_TRAN";
DROP TABLE IF EXISTS public."tblSubsectionB2";
DROP TABLE IF EXISTS public."tblSectionC_TRAN";
DROP TABLE IF EXISTS public."tblSectionC";
DROP TABLE IF EXISTS public."tblSalPurGroup_Tran";
DROP TABLE IF EXISTS public."tblSalPurGroup";
DROP TABLE IF EXISTS public."tblPurchaseOrder_TRAN";
DROP TABLE IF EXISTS public."tblPurchaseOrder";
DROP TABLE IF EXISTS public."tblPurSales_Tran";
DROP TABLE IF EXISTS public."tblPurSales";
DROP TABLE IF EXISTS public."tblMaterial";
DROP TABLE IF EXISTS public."tblGateEntry";
DROP TABLE IF EXISTS public."tblCategory";
DROP TABLE IF EXISTS public."tblCASHBANK_TRAN";
DROP TABLE IF EXISTS public."tblCASHBANK";
DROP TABLE IF EXISTS public."tblBroker";
DROP TABLE IF EXISTS public."tblAccountmaster";
DROP TABLE IF EXISTS public.django_session;
DROP TABLE IF EXISTS public.django_migrations;
DROP TABLE IF EXISTS public.django_content_type;
DROP TABLE IF EXISTS public.django_admin_log;
DROP TABLE IF EXISTS public.dashboard_voucherfact;
DROP TABLE IF EXISTS public.dashboard_voucher;
DROP TABLE IF EXISTS public.auth_user_user_permissions;
DROP TABLE IF EXISTS public.auth_user_groups;
DROP TABLE IF EXISTS public.auth_user;
DROP TABLE IF EXISTS public.auth_permission;
DROP TABLE IF EXISTS public.auth_group_permissions;
DROP TABLE IF EXISTS public.auth_group;
DROP PROCEDURE IF EXISTS public.sp_upsert_b2_voucher(INOUT p_voucher_no character varying, IN p_transaction_date timestamp without time zone, IN p_tran_type character varying, IN p_rpid character varying, IN p_amount numeric, IN p_narration character varying, IN p_bank_account_id integer, IN p_ref_voucher_no character varying, IN p_posting_status character varying, IN p_user character varying, IN p_details_json jsonb);
DROP PROCEDURE IF EXISTS public.sp_manage_transaction(IN p_operation character varying, IN p_module character varying, INOUT p_voucher_no character varying, IN p_date timestamp without time zone, IN p_tran_type character varying, IN p_rpid character varying, IN p_amount numeric, IN p_narration character varying, IN p_bank_account_id integer, IN p_user character varying, IN p_ref_voucher_no character varying, IN p_posting_status character varying, IN p_details_json jsonb);
DROP PROCEDURE IF EXISTS public.sp_manage_purchase_order(IN p_operation character varying, INOUT p_po_no character varying, IN p_po_date timestamp without time zone, IN p_expected_delivery_date date, IN p_po_status character varying, IN p_supplier_id integer, IN p_broker_id integer, IN p_zone_name character varying, IN p_supplier_contact character varying, IN p_supplier_address text, IN p_gst_number character varying, IN p_delivery_location character varying, IN p_delivery_terms character varying, IN p_payment_terms character varying, IN p_freight_terms character varying, IN p_currency character varying, IN p_purchaser_name character varying, IN p_department character varying, IN p_cost_center character varying, IN p_special_instructions text, IN p_internal_notes text, IN p_total_basic_amount numeric, IN p_taxes numeric, IN p_grand_total numeric, IN p_user character varying, IN p_sal_pur_group_id bigint, IN p_items_json jsonb);
DROP FUNCTION IF EXISTS public.sp_get_b2_ledger_report(p_start_date timestamp without time zone, p_end_date timestamp without time zone, p_limit integer, p_offset integer);
DROP FUNCTION IF EXISTS public.sp_get_b2_dashboard_aggregates(p_start_date timestamp without time zone, p_end_date timestamp without time zone);
DROP FUNCTION IF EXISTS public.fn_verify_b2_lock();
DROP FUNCTION IF EXISTS public.fn_generate_b2_voucher_no(p_date timestamp without time zone);
DROP FUNCTION IF EXISTS public.fn_calculate_b2_balance(p_bank_account_id integer, p_up_to_date timestamp without time zone);
--
-- Name: fn_calculate_b2_balance(integer, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: alpha_user
--

CREATE FUNCTION public.fn_calculate_b2_balance(p_bank_account_id integer, p_up_to_date timestamp without time zone) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
                DECLARE
                    v_balance DECIMAL(15, 2) := 0.00;
                BEGIN
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN rpid IN ('R', 'D') THEN amount
                            WHEN rpid IN ('P', 'I') THEN -amount
                            ELSE 0.00
                        END
                    ), 0.00) INTO v_balance
                    FROM "tblSubsectionB2"
                    WHERE "BankAccount" = p_bank_account_id
                      AND transaction_date <= p_up_to_date
                      AND status = TRUE;
                      
                    RETURN v_balance;
                END;
                $$;


ALTER FUNCTION public.fn_calculate_b2_balance(p_bank_account_id integer, p_up_to_date timestamp without time zone) OWNER TO alpha_user;

--
-- Name: fn_generate_b2_voucher_no(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: alpha_user
--

CREATE FUNCTION public.fn_generate_b2_voucher_no(p_date timestamp without time zone) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
                DECLARE
                    v_prefix VARCHAR(10);
                    v_year_month VARCHAR(6);
                    v_next_seq INT;
                    v_voucher_no VARCHAR(50);
                BEGIN
                    v_year_month := to_char(p_date, 'YYYYMM');
                    v_prefix := 'B2-' || v_year_month || '-';
                    
                    SELECT COALESCE(MAX(CAST(SUBSTRING(voucher_no, 11, 4) AS INT)), 0) + 1
                    INTO v_next_seq
                    FROM "tblSubsectionB2"
                    WHERE voucher_no LIKE v_prefix || '%';
                    
                    v_voucher_no := v_prefix || lpad(v_next_seq::text, 4, '0');
                    RETURN v_voucher_no;
                END;
                $$;


ALTER FUNCTION public.fn_generate_b2_voucher_no(p_date timestamp without time zone) OWNER TO alpha_user;

--
-- Name: fn_verify_b2_lock(); Type: FUNCTION; Schema: public; Owner: alpha_user
--

CREATE FUNCTION public.fn_verify_b2_lock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
                BEGIN
                    IF TG_TABLE_NAME = 'tblSubsectionB2' THEN
                        IF OLD.posting_status = 'POSTED' THEN
                            RAISE EXCEPTION 'Transaction is locked (POSTED) and cannot be updated or deleted.';
                        END IF;
                    ELSIF TG_TABLE_NAME = 'tblSubsectionB2_TRAN' THEN
                        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                            IF EXISTS (
                                SELECT 1 FROM "tblSubsectionB2" 
                                WHERE voucher_no = NEW."VoucherNo" AND posting_status = 'POSTED'
                            ) THEN
                                RAISE EXCEPTION 'Parent transaction is locked (POSTED). Child detail modifications are prohibited.';
                            END IF;
                        ELSIF TG_OP = 'DELETE' THEN
                            IF EXISTS (
                                SELECT 1 FROM "tblSubsectionB2" 
                                WHERE voucher_no = OLD."VoucherNo" AND posting_status = 'POSTED'
                            ) THEN
                                RAISE EXCEPTION 'Parent transaction is locked (POSTED). Child detail modifications are prohibited.';
                            END IF;
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                $$;


ALTER FUNCTION public.fn_verify_b2_lock() OWNER TO alpha_user;

--
-- Name: sp_get_b2_dashboard_aggregates(timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: alpha_user
--

CREATE FUNCTION public.sp_get_b2_dashboard_aggregates(p_start_date timestamp without time zone, p_end_date timestamp without time zone) RETURNS TABLE(category_name character varying, group_name character varying, total_amount numeric)
    LANGUAGE plpgsql
    AS $$
                BEGIN
                    RETURN QUERY
                    SELECT 
                        h.tran_type::VARCHAR(50) AS category_name,
                        COALESCE(c."Account_Name", 'Unknown')::VARCHAR(100) AS group_name,
                        SUM(d.amount) AS total_amount
                    FROM "tblSubsectionB2" h
                    JOIN "tblSubsectionB2_TRAN" d ON h.voucher_no = d."VoucherNo"
                    LEFT JOIN "tblAccountmaster" c ON d.accountmaster_id = c.id
                    WHERE h.transaction_date BETWEEN p_start_date AND p_end_date
                      AND h.status = TRUE
                    GROUP BY h.tran_type, c."Account_Name";
                END;
                $$;


ALTER FUNCTION public.sp_get_b2_dashboard_aggregates(p_start_date timestamp without time zone, p_end_date timestamp without time zone) OWNER TO alpha_user;

--
-- Name: sp_get_b2_ledger_report(timestamp without time zone, timestamp without time zone, integer, integer); Type: FUNCTION; Schema: public; Owner: alpha_user
--

CREATE FUNCTION public.sp_get_b2_ledger_report(p_start_date timestamp without time zone, p_end_date timestamp without time zone, p_limit integer, p_offset integer) RETURNS TABLE(voucher_no character varying, transaction_date timestamp without time zone, tran_type character varying, rpid character varying, amount numeric, narration character varying, posting_status character varying, total_records bigint)
    LANGUAGE plpgsql
    AS $$
                DECLARE
                    v_total_records BIGINT;
                BEGIN
                    SELECT COUNT(*) INTO v_total_records
                    FROM "tblSubsectionB2"
                    WHERE transaction_date BETWEEN p_start_date AND p_end_date
                      AND status = TRUE;

                    RETURN QUERY
                    SELECT 
                        h.voucher_no::VARCHAR(50),
                        h.transaction_date,
                        h.tran_type::VARCHAR(4),
                        h.rpid::VARCHAR(1),
                        h.amount,
                        h.narration::VARCHAR(200),
                        h.posting_status::VARCHAR(20),
                        v_total_records
                    FROM "tblSubsectionB2" h
                    WHERE h.transaction_date BETWEEN p_start_date AND p_end_date
                      AND h.status = TRUE
                    ORDER BY h.transaction_date DESC, h.date_created DESC
                    LIMIT p_limit
                    OFFSET p_offset;
                END;
                $$;


ALTER FUNCTION public.sp_get_b2_ledger_report(p_start_date timestamp without time zone, p_end_date timestamp without time zone, p_limit integer, p_offset integer) OWNER TO alpha_user;

--
-- Name: sp_manage_purchase_order(character varying, character varying, timestamp without time zone, date, character varying, integer, integer, character varying, character varying, text, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, text, text, numeric, numeric, numeric, character varying, bigint, jsonb); Type: PROCEDURE; Schema: public; Owner: alpha_user
--

CREATE PROCEDURE public.sp_manage_purchase_order(IN p_operation character varying, INOUT p_po_no character varying, IN p_po_date timestamp without time zone, IN p_expected_delivery_date date, IN p_po_status character varying, IN p_supplier_id integer, IN p_broker_id integer, IN p_zone_name character varying, IN p_supplier_contact character varying, IN p_supplier_address text, IN p_gst_number character varying, IN p_delivery_location character varying, IN p_delivery_terms character varying, IN p_payment_terms character varying, IN p_freight_terms character varying, IN p_currency character varying, IN p_purchaser_name character varying, IN p_department character varying, IN p_cost_center character varying, IN p_special_instructions text, IN p_internal_notes text, IN p_total_basic_amount numeric, IN p_taxes numeric, IN p_grand_total numeric, IN p_user character varying, IN p_sal_pur_group_id bigint, IN p_items_json jsonb DEFAULT '[]'::jsonb)
    LANGUAGE plpgsql
    AS $_$
            DECLARE
                v_prefix  VARCHAR(20);
                v_last_no INT;
            BEGIN
                -- -------------------------------------------------------
                -- INSERT: auto-generate PO No then insert header + items
                -- -------------------------------------------------------
                IF p_operation = 'INSERT' THEN

                    -- Auto-generate PO number if not supplied
                    IF p_po_no IS NULL OR p_po_no = '' OR p_po_no = 'Auto Generated' THEN
                        v_prefix := 'PO-' || TO_CHAR(p_po_date, 'YYYYMM') || '-';

                        SELECT COALESCE(
                            MAX(
                                CASE
                                    WHEN REPLACE(po_no, v_prefix, '') ~ '^[0-9]+$'
                                    THEN REPLACE(po_no, v_prefix, '')::INT
                                    ELSE 0
                                END
                            ), 0
                        ) + 1
                        INTO v_last_no
                        FROM "tblPurchaseOrder"
                        WHERE po_no LIKE v_prefix || '%';

                        p_po_no := v_prefix || LPAD(v_last_no::TEXT, 4, '0');
                    END IF;

                    -- Insert header record
                    INSERT INTO "tblPurchaseOrder" (
                        po_no,
                        po_date,
                        expected_delivery_date,
                        po_status,
                        "SalPurGroupID",
                        supplier_id,
                        broker_id,
                        zone_name,
                        supplier_contact,
                        supplier_address,
                        gst_number,
                        delivery_location,
                        delivery_terms,
                        payment_terms,
                        freight_terms,
                        currency,
                        purchaser_name,
                        department,
                        cost_center,
                        special_instructions,
                        internal_notes,
                        total_basic_amount,
                        taxes,
                        grand_total,
                        status,
                        user_created,
                        date_created,
                        user_modified,
                        date_modified
                    ) VALUES (
                        p_po_no,
                        p_po_date,
                        p_expected_delivery_date,
                        p_po_status,
                        p_sal_pur_group_id,
                        p_supplier_id,
                        p_broker_id,
                        p_zone_name,
                        p_supplier_contact,
                        p_supplier_address,
                        p_gst_number,
                        p_delivery_location,
                        p_delivery_terms,
                        p_payment_terms,
                        p_freight_terms,
                        p_currency,
                        p_purchaser_name,
                        p_department,
                        p_cost_center,
                        p_special_instructions,
                        p_internal_notes,
                        p_total_basic_amount,
                        p_taxes,
                        p_grand_total,
                        TRUE,
                        p_user,
                        CURRENT_TIMESTAMP,
                        p_user,
                        CURRENT_TIMESTAMP
                    );

                    -- Insert detail (item) rows from JSON array
                    INSERT INTO "tblPurchaseOrder_TRAN" (
                        "PONo",
                        item_id,
                        order_qty,
                        uom,
                        unit_rate,
                        amount,
                        remarks,
                        user_created,
                        date_created,
                        user_modified,
                        date_modified
                    )
                    SELECT
                        p_po_no,
                        (d->>'item_id')::INT,
                        (d->>'order_qty')::DECIMAL(15, 4),
                        d->>'uom',
                        (d->>'unit_rate')::DECIMAL(15, 4),
                        (d->>'amount')::DECIMAL(15, 2),
                        d->>'remarks',
                        p_user,
                        CURRENT_TIMESTAMP,
                        p_user,
                        CURRENT_TIMESTAMP
                    FROM jsonb_array_elements(p_items_json) AS d;

                -- -------------------------------------------------------
                -- UPDATE: update header, wipe old items, re-insert new ones
                -- -------------------------------------------------------
                ELSIF p_operation = 'UPDATE' THEN

                    UPDATE "tblPurchaseOrder" SET
                        po_date                = p_po_date,
                        expected_delivery_date = p_expected_delivery_date,
                        po_status              = p_po_status,
                        "SalPurGroupID"        = p_sal_pur_group_id,
                        supplier_id            = p_supplier_id,
                        broker_id              = p_broker_id,
                        zone_name              = p_zone_name,
                        supplier_contact       = p_supplier_contact,
                        supplier_address       = p_supplier_address,
                        gst_number             = p_gst_number,
                        delivery_location      = p_delivery_location,
                        delivery_terms         = p_delivery_terms,
                        payment_terms          = p_payment_terms,
                        freight_terms          = p_freight_terms,
                        currency               = p_currency,
                        purchaser_name         = p_purchaser_name,
                        department             = p_department,
                        cost_center            = p_cost_center,
                        special_instructions   = p_special_instructions,
                        internal_notes         = p_internal_notes,
                        total_basic_amount     = p_total_basic_amount,
                        taxes                  = p_taxes,
                        grand_total            = p_grand_total,
                        user_modified          = p_user,
                        date_modified          = CURRENT_TIMESTAMP
                    WHERE po_no = p_po_no;

                    -- Remove all existing item lines
                    DELETE FROM "tblPurchaseOrder_TRAN" WHERE "PONo" = p_po_no;

                    -- Re-insert the updated item lines
                    INSERT INTO "tblPurchaseOrder_TRAN" (
                        "PONo",
                        item_id,
                        order_qty,
                        uom,
                        unit_rate,
                        amount,
                        remarks,
                        user_created,
                        date_created,
                        user_modified,
                        date_modified
                    )
                    SELECT
                        p_po_no,
                        (d->>'item_id')::INT,
                        (d->>'order_qty')::DECIMAL(15, 4),
                        d->>'uom',
                        (d->>'unit_rate')::DECIMAL(15, 4),
                        (d->>'amount')::DECIMAL(15, 2),
                        d->>'remarks',
                        p_user,
                        CURRENT_TIMESTAMP,
                        p_user,
                        CURRENT_TIMESTAMP
                    FROM jsonb_array_elements(p_items_json) AS d;

                -- -------------------------------------------------------
                -- DELETE: soft-delete — set status = FALSE
                -- -------------------------------------------------------
                ELSIF p_operation = 'DELETE' THEN

                    UPDATE "tblPurchaseOrder" SET
                        status        = FALSE,
                        user_modified = p_user,
                        date_modified = CURRENT_TIMESTAMP
                    WHERE po_no = p_po_no;

                -- -------------------------------------------------------
                -- HARD_DELETE: permanently remove items then header
                -- -------------------------------------------------------
                ELSIF p_operation = 'HARD_DELETE' THEN

                    DELETE FROM "tblPurchaseOrder_TRAN" WHERE "PONo" = p_po_no;
                    DELETE FROM "tblPurchaseOrder" WHERE po_no = p_po_no;

                END IF;
            END;
            $_$;


ALTER PROCEDURE public.sp_manage_purchase_order(IN p_operation character varying, INOUT p_po_no character varying, IN p_po_date timestamp without time zone, IN p_expected_delivery_date date, IN p_po_status character varying, IN p_supplier_id integer, IN p_broker_id integer, IN p_zone_name character varying, IN p_supplier_contact character varying, IN p_supplier_address text, IN p_gst_number character varying, IN p_delivery_location character varying, IN p_delivery_terms character varying, IN p_payment_terms character varying, IN p_freight_terms character varying, IN p_currency character varying, IN p_purchaser_name character varying, IN p_department character varying, IN p_cost_center character varying, IN p_special_instructions text, IN p_internal_notes text, IN p_total_basic_amount numeric, IN p_taxes numeric, IN p_grand_total numeric, IN p_user character varying, IN p_sal_pur_group_id bigint, IN p_items_json jsonb) OWNER TO alpha_user;

--
-- Name: sp_manage_transaction(character varying, character varying, character varying, timestamp without time zone, character varying, character varying, numeric, character varying, integer, character varying, character varying, character varying, jsonb); Type: PROCEDURE; Schema: public; Owner: alpha_user
--

CREATE PROCEDURE public.sp_manage_transaction(IN p_operation character varying, IN p_module character varying, INOUT p_voucher_no character varying, IN p_date timestamp without time zone, IN p_tran_type character varying, IN p_rpid character varying, IN p_amount numeric, IN p_narration character varying, IN p_bank_account_id integer, IN p_user character varying, IN p_ref_voucher_no character varying DEFAULT NULL::character varying, IN p_posting_status character varying DEFAULT NULL::character varying, IN p_details_json jsonb DEFAULT '[]'::jsonb)
    LANGUAGE plpgsql
    AS $_$
DECLARE
    v_detail_sum DECIMAL(15, 2) := 0.00;
BEGIN
    -- ── Amount validation (module-aware) ─────────────────────────────
    IF p_operation = 'INSERT' OR p_operation = 'UPDATE' THEN
        IF p_module = 'SECTION_A' THEN
            -- Double-entry journal: p_amount = sum of debit (A) rows only.
            -- Credit (B) rows equal the same value but are NOT added to p_amount.
            SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00)
              INTO v_detail_sum
              FROM jsonb_array_elements(p_details_json) AS d
             WHERE d->>'rpid' = 'A';
        ELSE
            -- Single-sided entries (cash/bank/section-c): all rows are one type.
            SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00)
              INTO v_detail_sum
              FROM jsonb_array_elements(p_details_json) AS d;
        END IF;

        IF v_detail_sum <> p_amount THEN
            RAISE EXCEPTION 'Header amount does not match sum of detail lines.';
        END IF;
    END IF;

    -- ── SECTION_A handler (journal voucher → tblCASHBANK) ────────────
    IF p_module = 'SECTION_A' THEN

        IF p_operation = 'INSERT' THEN
            -- Auto-generate numeric voucher number when not supplied
            IF p_voucher_no IS NULL OR p_voucher_no = '' OR p_voucher_no = 'Auto-Generated' THEN
                SELECT COALESCE(MAX(voucher_no::BIGINT), 0) + 1
                  INTO p_voucher_no
                  FROM "tblCASHBANK"
                 WHERE voucher_no ~ '^[0-9]+$';
                p_voucher_no := p_voucher_no::TEXT;
            END IF;

            INSERT INTO "tblCASHBANK" (
                voucher_no, date, tran_type, rpid, amount, narration,
                "BankAccount", status, module_type,
                user_created, date_created, user_modified, date_modified
            ) VALUES (
                p_voucher_no, p_date, p_tran_type, p_rpid, p_amount, p_narration,
                p_bank_account_id, TRUE, '',
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            );

            -- Insert each detail row; store each row's own rpid (A or B)
            INSERT INTO "tblCASHBANK_TRAN" (
                "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                remarks, cost_center, chq_no, chq_date, payee_bank,
                user_created, date_created, user_modified, date_modified
            )
            SELECT
                p_voucher_no,
                p_date,
                p_tran_type,
                d->>'rpid',
                (d->>'account_master')::INT,
                (d->>'amount')::DECIMAL(15, 2),
                COALESCE(d->>'remarks', ''),
                COALESCE(d->>'cost_center', ''),
                COALESCE(d->>'chq_no', ''),
                CASE
                    WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                    THEN (d->>'chq_date')::DATE
                    ELSE NULL
                END,
                COALESCE(d->>'payee_bank', ''),
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            FROM jsonb_array_elements(p_details_json) AS d;

        ELSIF p_operation = 'UPDATE' THEN
            UPDATE "tblCASHBANK" SET
                date          = p_date,
                tran_type     = p_tran_type,
                rpid          = p_rpid,
                amount        = p_amount,
                narration     = p_narration,
                "BankAccount" = p_bank_account_id,
                user_modified = p_user,
                date_modified = CURRENT_TIMESTAMP
            WHERE voucher_no = p_voucher_no;

            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;

            INSERT INTO "tblCASHBANK_TRAN" (
                "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                remarks, cost_center, chq_no, chq_date, payee_bank,
                user_created, date_created, user_modified, date_modified
            )
            SELECT
                p_voucher_no,
                p_date,
                p_tran_type,
                d->>'rpid',
                (d->>'account_master')::INT,
                (d->>'amount')::DECIMAL(15, 2),
                COALESCE(d->>'remarks', ''),
                COALESCE(d->>'cost_center', ''),
                COALESCE(d->>'chq_no', ''),
                CASE
                    WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                    THEN (d->>'chq_date')::DATE
                    ELSE NULL
                END,
                COALESCE(d->>'payee_bank', ''),
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            FROM jsonb_array_elements(p_details_json) AS d;

        ELSIF p_operation = 'DELETE' THEN
            UPDATE "tblCASHBANK" SET
                status        = FALSE,
                user_modified = p_user,
                date_modified = CURRENT_TIMESTAMP
            WHERE voucher_no = p_voucher_no;

        ELSIF p_operation = 'HARD_DELETE' THEN
            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
            DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
        END IF;

    -- ── SECTION_C handler (cash voucher → tblCASHBANK) ────────────
    ELSIF p_module = 'SECTION_C' THEN

        IF p_operation = 'INSERT' THEN
            INSERT INTO "tblCASHBANK" (
                voucher_no, date, tran_type, rpid, amount, narration,
                "BankAccount", status, module_type,
                user_created, date_created, user_modified, date_modified
            ) VALUES (
                p_voucher_no, p_date, p_tran_type, p_rpid, p_amount, p_narration,
                p_bank_account_id, TRUE, '',
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            );

            INSERT INTO "tblCASHBANK_TRAN" (
                "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                remarks, chq_no, chq_date, payee_bank,
                user_created, date_created, user_modified, date_modified
            )
            SELECT
                p_voucher_no, p_date, p_tran_type, p_rpid,
                (d->>'account_master')::INT,
                (d->>'amount')::DECIMAL(15, 2),
                d->>'remarks', d->>'chq_no',
                CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                     THEN (d->>'chq_date')::DATE ELSE NULL END,
                d->>'payee_bank',
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            FROM jsonb_array_elements(p_details_json) AS d;

        ELSIF p_operation = 'UPDATE' THEN
            UPDATE "tblCASHBANK" SET
                date          = p_date,
                tran_type     = p_tran_type,
                rpid          = p_rpid,
                amount        = p_amount,
                narration     = p_narration,
                "BankAccount" = p_bank_account_id,
                user_modified = p_user,
                date_modified = CURRENT_TIMESTAMP
            WHERE voucher_no = p_voucher_no;

            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;

            INSERT INTO "tblCASHBANK_TRAN" (
                "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                remarks, chq_no, chq_date, payee_bank,
                user_created, date_created, user_modified, date_modified
            )
            SELECT
                p_voucher_no, p_date, p_tran_type, p_rpid,
                (d->>'account_master')::INT,
                (d->>'amount')::DECIMAL(15, 2),
                d->>'remarks', d->>'chq_no',
                CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                     THEN (d->>'chq_date')::DATE ELSE NULL END,
                d->>'payee_bank',
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            FROM jsonb_array_elements(p_details_json) AS d;

        ELSIF p_operation = 'DELETE' THEN
            UPDATE "tblCASHBANK" SET
                status        = FALSE,
                user_modified = p_user,
                date_modified = CURRENT_TIMESTAMP
            WHERE voucher_no = p_voucher_no;

        ELSIF p_operation = 'HARD_DELETE' THEN
            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
            DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
        END IF;

    -- ── BANK_TRANSACTION / SUBSECTION_B2 / SUBSECTION_Y handler ──────
    ELSIF p_module IN ('BANK_TRANSACTION', 'SUBSECTION_B2', 'SUBSECTION_Y') THEN
        DECLARE
            v_module_type VARCHAR(10) := '';
        BEGIN
            IF p_module = 'SUBSECTION_B2' THEN
                v_module_type := 'B2';
            ELSIF p_module = 'SUBSECTION_Y' THEN
                v_module_type := 'Y';
            END IF;

            IF p_operation = 'INSERT' THEN
                IF v_module_type = 'B2' AND (p_voucher_no IS NULL OR p_voucher_no = '') THEN
                    p_voucher_no := fn_generate_b2_voucher_no(p_date);
                END IF;

                INSERT INTO "tblCASHBANK" (
                    voucher_no, date, tran_type, rpid, amount, narration,
                    "BankAccount", status, module_type, posting_status, ref_voucher_no,
                    user_created, date_created, user_modified, date_modified
                ) VALUES (
                    p_voucher_no, p_date, p_tran_type, p_rpid, p_amount, p_narration,
                    p_bank_account_id, TRUE, v_module_type, p_posting_status, p_ref_voucher_no,
                    p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                );

                INSERT INTO "tblCASHBANK_TRAN" (
                    "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                    remarks, cost_center, chq_no, chq_date, payee_bank,
                    user_created, date_created, user_modified, date_modified
                )
                SELECT
                    p_voucher_no, p_date, p_tran_type, p_rpid,
                    (d->>'account_master')::INT,
                    (d->>'amount')::DECIMAL(15, 2),
                    d->>'remarks', d->>'cost_center', d->>'chq_no',
                    CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                         THEN (d->>'chq_date')::DATE ELSE NULL END,
                    d->>'payee_bank',
                    p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                FROM jsonb_array_elements(p_details_json) AS d;

            ELSIF p_operation = 'UPDATE' THEN
                IF v_module_type = 'B2' AND EXISTS (
                    SELECT 1 FROM "tblCASHBANK"
                    WHERE voucher_no = p_voucher_no AND posting_status = 'POSTED'
                ) THEN
                    RAISE EXCEPTION 'Cannot edit a POSTED transaction.';
                END IF;

                UPDATE "tblCASHBANK" SET
                    date          = p_date,
                    tran_type     = p_tran_type,
                    rpid          = p_rpid,
                    amount        = p_amount,
                    narration     = p_narration,
                    "BankAccount" = p_bank_account_id,
                    posting_status = p_posting_status,
                    ref_voucher_no = p_ref_voucher_no,
                    user_modified = p_user,
                    date_modified = CURRENT_TIMESTAMP
                WHERE voucher_no = p_voucher_no;

                DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;

                INSERT INTO "tblCASHBANK_TRAN" (
                    "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                    remarks, cost_center, chq_no, chq_date, payee_bank,
                    user_created, date_created, user_modified, date_modified
                )
                SELECT
                    p_voucher_no, p_date, p_tran_type, p_rpid,
                    (d->>'account_master')::INT,
                    (d->>'amount')::DECIMAL(15, 2),
                    d->>'remarks', d->>'cost_center', d->>'chq_no',
                    CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                         THEN (d->>'chq_date')::DATE ELSE NULL END,
                    d->>'payee_bank',
                    p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                FROM jsonb_array_elements(p_details_json) AS d;

            ELSIF p_operation = 'DELETE' THEN
                IF v_module_type IN ('B2', 'Y') THEN
                    UPDATE "tblCASHBANK" SET
                        status        = FALSE,
                        user_modified = p_user,
                        date_modified = CURRENT_TIMESTAMP
                    WHERE voucher_no = p_voucher_no;
                ELSE
                    DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
                    DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
                END IF;

            ELSIF p_operation = 'HARD_DELETE' THEN
                DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
                DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
            END IF;
        END;
    END IF;
END;
$_$;


ALTER PROCEDURE public.sp_manage_transaction(IN p_operation character varying, IN p_module character varying, INOUT p_voucher_no character varying, IN p_date timestamp without time zone, IN p_tran_type character varying, IN p_rpid character varying, IN p_amount numeric, IN p_narration character varying, IN p_bank_account_id integer, IN p_user character varying, IN p_ref_voucher_no character varying, IN p_posting_status character varying, IN p_details_json jsonb) OWNER TO alpha_user;

--
-- Name: sp_upsert_b2_voucher(character varying, timestamp without time zone, character varying, character varying, numeric, character varying, integer, character varying, character varying, character varying, jsonb); Type: PROCEDURE; Schema: public; Owner: alpha_user
--

CREATE PROCEDURE public.sp_upsert_b2_voucher(INOUT p_voucher_no character varying, IN p_transaction_date timestamp without time zone, IN p_tran_type character varying, IN p_rpid character varying, IN p_amount numeric, IN p_narration character varying, IN p_bank_account_id integer, IN p_ref_voucher_no character varying, IN p_posting_status character varying, IN p_user character varying, IN p_details_json jsonb)
    LANGUAGE plpgsql
    AS $$
                DECLARE
                    v_is_new BOOLEAN := FALSE;
                    v_detail_sum DECIMAL(15, 2) := 0.00;
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM "tblSubsectionB2" 
                        WHERE voucher_no = p_voucher_no AND posting_status = 'POSTED'
                    ) THEN
                        RAISE EXCEPTION 'Cannot edit a POSTED transaction.';
                    END IF;

                    SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00) INTO v_detail_sum
                    FROM jsonb_array_elements(p_details_json) AS d;

                    IF v_detail_sum <> p_amount THEN
                        RAISE EXCEPTION 'Header amount does not match sum of detail lines.';
                    END IF;

                    IF p_voucher_no IS NULL OR p_voucher_no = '' THEN
                        p_voucher_no := fn_generate_b2_voucher_no(p_transaction_date);
                        v_is_new := TRUE;
                    END IF;

                    IF v_is_new THEN
                        INSERT INTO "tblSubsectionB2" (
                            voucher_no, transaction_date, tran_type, rpid, amount, narration,
                            "BankAccount", ref_voucher_no, status, posting_status,
                            user_created, date_created, user_modified, date_modified
                        ) VALUES (
                            p_voucher_no, p_transaction_date, p_tran_type, p_rpid, p_amount, p_narration,
                            p_bank_account_id, p_ref_voucher_no, TRUE, p_posting_status,
                            p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                        );
                    ELSE
                        UPDATE "tblSubsectionB2" SET
                            transaction_date = p_transaction_date,
                            tran_type = p_tran_type,
                            rpid = p_rpid,
                            amount = p_amount,
                            narration = p_narration,
                            "BankAccount" = p_bank_account_id,
                            ref_voucher_no = p_ref_voucher_no,
                            posting_status = p_posting_status,
                            user_modified = p_user,
                            date_modified = CURRENT_TIMESTAMP
                        WHERE voucher_no = p_voucher_no;
                    END IF;

                    DELETE FROM "tblSubsectionB2_TRAN" WHERE "VoucherNo" = p_voucher_no;

                    INSERT INTO "tblSubsectionB2_TRAN" (
                        "VoucherNo", transaction_date, tran_type, rpid, accountmaster_id, amount,
                        remarks, cost_center, chq_no, chq_date, payee_bank,
                        user_created, date_created, user_modified, date_modified
                    )
                    SELECT
                        p_voucher_no,
                        p_transaction_date,
                        p_tran_type,
                        p_rpid,
                        COALESCE((d->>'account_master_id')::INT, (d->>'account_master')::INT, (d->>'accountmaster_id')::INT, (d->>'account_master')::INT, (d->>'alpha_group_id')::INT, (d->>'alpha_group')::INT),
                        (d->>'amount')::DECIMAL(15, 2),
                        d->>'remarks',
                        d->>'cost_center',
                        d->>'chq_no',
                        CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> '' THEN (d->>'chq_date')::DATE ELSE NULL END,
                        d->>'payee_bank',
                        p_user,
                        CURRENT_TIMESTAMP,
                        p_user,
                        CURRENT_TIMESTAMP
                    FROM jsonb_array_elements(p_details_json) AS d;
                END;
                $$;


ALTER PROCEDURE public.sp_upsert_b2_voucher(INOUT p_voucher_no character varying, IN p_transaction_date timestamp without time zone, IN p_tran_type character varying, IN p_rpid character varying, IN p_amount numeric, IN p_narration character varying, IN p_bank_account_id integer, IN p_ref_voucher_no character varying, IN p_posting_status character varying, IN p_user character varying, IN p_details_json jsonb) OWNER TO alpha_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO alpha_user;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO alpha_user;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO alpha_user;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO alpha_user;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO alpha_user;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO alpha_user;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dashboard_voucher; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.dashboard_voucher (
    id bigint NOT NULL,
    voucher_number character varying(15) NOT NULL,
    voucher_date date NOT NULL,
    remarks text,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.dashboard_voucher OWNER TO alpha_user;

--
-- Name: dashboard_voucher_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.dashboard_voucher ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.dashboard_voucher_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dashboard_voucherfact; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.dashboard_voucherfact (
    id bigint NOT NULL,
    row_type character varying(1) NOT NULL,
    amount numeric(15,2) NOT NULL,
    accountmaster_id bigint CONSTRAINT dashboard_voucherfact_alpha_group_id_not_null NOT NULL,
    voucher_id bigint NOT NULL,
    remarks character varying(200),
    voucher_date date
);


ALTER TABLE public.dashboard_voucherfact OWNER TO alpha_user;

--
-- Name: dashboard_voucherfact_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.dashboard_voucherfact ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.dashboard_voucherfact_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO alpha_user;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO alpha_user;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO alpha_user;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO alpha_user;

--
-- Name: tblAccountmaster; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblAccountmaster" (
    id bigint CONSTRAINT "tblAlphagroup_id_not_null" NOT NULL,
    "groupID" bigint,
    "Account_Name" character varying(50) CONSTRAINT "tblAlphagroup_alpha_name_not_null" NOT NULL,
    display_name character varying(100) CONSTRAINT "tblAlphagroup_display_name_not_null" NOT NULL,
    is_active boolean CONSTRAINT "tblAlphagroup_is_active_not_null" NOT NULL,
    created_at timestamp with time zone CONSTRAINT "tblAlphagroup_created_at_not_null" NOT NULL,
    updated_at timestamp with time zone CONSTRAINT "tblAlphagroup_updated_at_not_null" NOT NULL,
    "categoryID" bigint CONSTRAINT "tblAlphagroup_categoryID_not_null" NOT NULL,
    "CL_BAL" numeric(15,2) CONSTRAINT "tblAlphagroup_CL_BAL_not_null" NOT NULL
);


ALTER TABLE public."tblAccountmaster" OWNER TO alpha_user;

--
-- Name: tblAlphagroup_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblAccountmaster" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblAlphagroup_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblBroker; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblBroker" (
    "BrokerID" bigint,
    "BrokerName" character varying,
    "BrokerAddress" character varying,
    "ContactNo" character varying,
    "PANo" character varying,
    "UserCreated" character varying,
    "DateCreated" timestamp with time zone,
    "UserModified" character varying,
    "DateModified" timestamp with time zone
);


ALTER TABLE public."tblBroker" OWNER TO alpha_user;

--
-- Name: tblCASHBANK; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblCASHBANK" (
    voucher_no character varying(50) NOT NULL,
    date timestamp with time zone NOT NULL,
    tran_type character varying(4) NOT NULL,
    rpid character varying(1),
    amount numeric(15,2) NOT NULL,
    narration character varying(200),
    status boolean NOT NULL,
    user_created character varying(50),
    date_created timestamp with time zone NOT NULL,
    user_modified character varying(50),
    date_modified timestamp with time zone NOT NULL,
    "BankAccount" bigint,
    module_type character varying(10) NOT NULL,
    posting_status character varying(20),
    ref_voucher_no character varying(50)
);


ALTER TABLE public."tblCASHBANK" OWNER TO alpha_user;

--
-- Name: tblCASHBANK_TRAN; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblCASHBANK_TRAN" (
    id bigint NOT NULL,
    date timestamp with time zone NOT NULL,
    tran_type character varying(4) NOT NULL,
    rpid character varying(1),
    amount numeric(15,2) NOT NULL,
    remarks character varying(200),
    chq_no character varying(50),
    chq_date date,
    payee_bank character varying(100),
    user_created character varying(50),
    date_created timestamp with time zone,
    user_modified character varying(50),
    date_modified timestamp with time zone,
    "VoucherNo" character varying(50) NOT NULL,
    accountmaster_id bigint,
    cost_center character varying(50)
);


ALTER TABLE public."tblCASHBANK_TRAN" OWNER TO alpha_user;

--
-- Name: tblCASHBANK_TRAN_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblCASHBANK_TRAN" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblCASHBANK_TRAN_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblCategory; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblCategory" (
    id bigint NOT NULL,
    "categoryName" character varying(50) NOT NULL,
    "categoryType" character varying(1) NOT NULL
);


ALTER TABLE public."tblCategory" OWNER TO alpha_user;

--
-- Name: tblCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblCategory" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblCategory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblGateEntry; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblGateEntry" (
    id bigint NOT NULL,
    gate_pass_id character varying(20) NOT NULL,
    entry_datetime timestamp with time zone NOT NULL,
    vehicle_number character varying(20) NOT NULL,
    driver_name character varying(50) NOT NULL,
    photo text,
    created_at timestamp with time zone NOT NULL,
    created_by_id integer,
    supplier_id bigint NOT NULL,
    material_type_id bigint NOT NULL
);


ALTER TABLE public."tblGateEntry" OWNER TO alpha_user;

--
-- Name: tblGateEntry_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblGateEntry" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblGateEntry_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblMaterial; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblMaterial" (
    id bigint NOT NULL,
    material_name character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    "UOM" smallint DEFAULT 0,
    "SKU" smallint DEFAULT 0,
    "SKU2" smallint DEFAULT 0,
    "MAT_CAT" smallint DEFAULT 0,
    "OB_QTY" numeric DEFAULT 0,
    "OB_QTY2" numeric DEFAULT 0,
    "USER_CREATED" character varying,
    "DATE_CREATED" datemultirange,
    "USER_MODIFIED" character varying,
    "DATE_MODIFIED" datemultirange,
    "ReOrderLevelSKU1" numeric,
    "CL_BAL" numeric(12,0)[],
    "CL_BAL2" numeric(12,3)[],
    "ReOrderLevelSKU2" numeric(12,3),
    "PurchaseGST" numeric(5,2),
    "SalesGST" numeric(6,2),
    "IsActive" boolean,
    "ActiveFromDate" date,
    "ACtiveTodate" date,
    "PackingID" smallint,
    material_code character varying(20) NOT NULL,
    unit_weight numeric(18,3),
    "Auto1_Manual0_calc" boolean,
    "IsRateInclGSTY1N0" boolean
);


ALTER TABLE public."tblMaterial" OWNER TO alpha_user;

--
-- Name: COLUMN "tblMaterial"."PurchaseGST"; Type: COMMENT; Schema: public; Owner: alpha_user
--

COMMENT ON COLUMN public."tblMaterial"."PurchaseGST" IS 'Percentage of Purchase GST';


--
-- Name: COLUMN "tblMaterial"."SalesGST"; Type: COMMENT; Schema: public; Owner: alpha_user
--

COMMENT ON COLUMN public."tblMaterial"."SalesGST" IS 'GST on Sales';


--
-- Name: COLUMN "tblMaterial"."IsActive"; Type: COMMENT; Schema: public; Owner: alpha_user
--

COMMENT ON COLUMN public."tblMaterial"."IsActive" IS 'this is a flag to identify whether this item is active or inactive';


--
-- Name: COLUMN "tblMaterial"."ActiveFromDate"; Type: COMMENT; Schema: public; Owner: alpha_user
--

COMMENT ON COLUMN public."tblMaterial"."ActiveFromDate" IS 'Date from when this item is active';


--
-- Name: COLUMN "tblMaterial"."ACtiveTodate"; Type: COMMENT; Schema: public; Owner: alpha_user
--

COMMENT ON COLUMN public."tblMaterial"."ACtiveTodate" IS 'Date to which this item is active or inactive';


--
-- Name: COLUMN "tblMaterial"."PackingID"; Type: COMMENT; Schema: public; Owner: alpha_user
--

COMMENT ON COLUMN public."tblMaterial"."PackingID" IS 'Bass, 10 kg, 5kg, 60 Kgs ';


--
-- Name: tblMaterial_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblMaterial" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblMaterial_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblPurSales; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblPurSales" (
    "VoucherNo" character varying NOT NULL,
    "VoucherDate" date NOT NULL,
    "TranType" character varying NOT NULL,
    "OrderNo" character varying NOT NULL,
    "OrderDate" date NOT NULL,
    "PurSalGroupID" bigint NOT NULL,
    "PartyID" bigint,
    "BrokerID" bigint,
    "ZoneID" bigint,
    "DeliveryLocation" character varying,
    "DelTermsID" bigint,
    "PaymentTermsID" bigint,
    "FreightTermID" bigint,
    "CurrencyID" bigint,
    "IncotermID" bigint,
    "Purchaser_Saleman_ID" bigint,
    "DepartmentID" bigint,
    "CostCentrID" bigint,
    "SpecialInstructions" character varying,
    "InternalNotes" character(1),
    "UserCreated" character varying,
    "DatdCreated" date,
    "UserModified" character varying,
    "DateModified" date,
    "IGST0_SGST1" smallint,
    "CreditDays" integer DEFAULT 0
);


ALTER TABLE public."tblPurSales" OWNER TO alpha_user;

--
-- Name: tblPurSales_Tran; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblPurSales_Tran" (
    id bigint NOT NULL,
    "VoucherNo" character varying NOT NULL,
    "VoucherDate" date NOT NULL,
    "TranType" character varying NOT NULL,
    "Item_ID" bigint,
    "Bag" bigint,
    "Weight" numeric(18,3),
    unit_weight numeric(18,3),
    "Unit_rate" numeric(18,2),
    "Amount" numeric(18,2),
    gst_rate numeric(18,2),
    "IGST" numeric(18,2),
    "CGST" numeric(18,2),
    "SGST" numeric(18,2),
    "Total" numeric(18,2),
    "IsRateIncludingGST" boolean,
    "UserCreated" character varying,
    "DateCreated" timestamp with time zone,
    "UserModified" character varying,
    "DateModified" timestamp with time zone
);


ALTER TABLE public."tblPurSales_Tran" OWNER TO alpha_user;

--
-- Name: tblPurSales_Tran_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblPurSales_Tran" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblPurSales_Tran_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblPurchaseOrder; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblPurchaseOrder" (
    po_no character varying(50) NOT NULL,
    po_date timestamp with time zone NOT NULL,
    expected_delivery_date date,
    po_status character varying(20) NOT NULL,
    zone_name character varying(50) NOT NULL,
    supplier_contact character varying(50),
    supplier_address text,
    gst_number character varying(50),
    delivery_location character varying(100) NOT NULL,
    delivery_terms character varying(100) NOT NULL,
    payment_terms character varying(100) NOT NULL,
    freight_terms character varying(100) NOT NULL,
    currency character varying(10) NOT NULL,
    purchaser_name character varying(100),
    department character varying(50),
    cost_center character varying(50),
    special_instructions text,
    internal_notes text,
    total_basic_amount numeric(15,2) NOT NULL,
    taxes numeric(15,2) NOT NULL,
    grand_total numeric(15,2) NOT NULL,
    status boolean NOT NULL,
    user_created character varying(50),
    date_created timestamp with time zone NOT NULL,
    user_modified character varying(50),
    date_modified timestamp with time zone NOT NULL,
    broker_id integer,
    supplier_id integer NOT NULL,
    "SalPurGroupID" bigint
);


ALTER TABLE public."tblPurchaseOrder" OWNER TO alpha_user;

--
-- Name: tblPurchaseOrder_TRAN; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblPurchaseOrder_TRAN" (
    id bigint NOT NULL,
    order_qty numeric(15,4) NOT NULL,
    uom character varying(10) NOT NULL,
    unit_rate numeric(15,4) NOT NULL,
    amount numeric(15,2) NOT NULL,
    remarks character varying(200),
    user_created character varying(50),
    date_created timestamp with time zone,
    user_modified character varying(50),
    date_modified timestamp with time zone,
    item_id bigint NOT NULL,
    "PONo" character varying(50) NOT NULL
);


ALTER TABLE public."tblPurchaseOrder_TRAN" OWNER TO alpha_user;

--
-- Name: tblPurchaseOrder_TRAN_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblPurchaseOrder_TRAN" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblPurchaseOrder_TRAN_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblSalPurGroup; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblSalPurGroup" (
    "SalPurGroupID" bigint NOT NULL,
    "SalPurGroupName" character varying(255),
    "GroupwiseAccounting" boolean,
    "GroupwiseAccountID" bigint,
    "UserCreated" character varying(100),
    "DateCreated" timestamp with time zone,
    "UserModified" character varying(100),
    "DateModified" timestamp with time zone,
    "Interstate_Y_WithinState_N" boolean,
    "GST_Applicable_Y_N" boolean,
    "IsGSTApplicableY1N0" boolean,
    "IGST1_CGST0" boolean,
    is_active boolean DEFAULT true
);


ALTER TABLE public."tblSalPurGroup" OWNER TO alpha_user;

--
-- Name: tblSalPurGroup_SalPurGroupID_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblSalPurGroup" ALTER COLUMN "SalPurGroupID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblSalPurGroup_SalPurGroupID_seq"
    START WITH 16
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblSalPurGroup_Tran; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblSalPurGroup_Tran" (
    "ID" bigint NOT NULL,
    "ChargesName" character varying(255),
    "SalPurGroupID" bigint,
    "ChargeAccountID" bigint,
    "Auto_Y_Manual_N" boolean,
    "Rate" numeric(18,4),
    "Debit_D_Credit_C" character varying(1),
    "UserCreated" character varying(100),
    "DateCreated" timestamp with time zone,
    "UserModified" character varying(100),
    "DateModified" timestamp with time zone
);


ALTER TABLE public."tblSalPurGroup_Tran" OWNER TO alpha_user;

--
-- Name: tblSalPurGroup_Tran_ID_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblSalPurGroup_Tran" ALTER COLUMN "ID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblSalPurGroup_Tran_ID_seq"
    START WITH 8
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblSectionC; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblSectionC" (
    voucher_no character varying(50) NOT NULL,
    date timestamp with time zone NOT NULL,
    tran_type character varying(4) NOT NULL,
    rpid character varying(1) NOT NULL,
    amount numeric(15,2) NOT NULL,
    narration character varying(200),
    status boolean NOT NULL,
    user_created character varying(50),
    date_created timestamp with time zone NOT NULL,
    user_modified character varying(50),
    date_modified timestamp with time zone NOT NULL,
    "BankAccount" bigint
);


ALTER TABLE public."tblSectionC" OWNER TO alpha_user;

--
-- Name: tblSectionC_TRAN; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblSectionC_TRAN" (
    id bigint NOT NULL,
    date timestamp with time zone NOT NULL,
    tran_type character varying(4) NOT NULL,
    rpid character varying(1) NOT NULL,
    amount numeric(15,2) NOT NULL,
    remarks character varying(200),
    chq_no character varying(50),
    chq_date date,
    payee_bank character varying(100),
    user_created character varying(50),
    date_created timestamp with time zone,
    user_modified character varying(50),
    date_modified timestamp with time zone,
    accountmaster_id bigint,
    "VoucherNo" character varying(50) NOT NULL
);


ALTER TABLE public."tblSectionC_TRAN" OWNER TO alpha_user;

--
-- Name: tblSectionC_TRAN_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblSectionC_TRAN" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblSectionC_TRAN_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblSubsectionB2; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblSubsectionB2" (
    voucher_no character varying(50) NOT NULL,
    transaction_date timestamp with time zone CONSTRAINT "tblSubsectionB2_date_not_null" NOT NULL,
    tran_type character varying(4) NOT NULL,
    rpid character varying(1) NOT NULL,
    amount numeric(15,2) NOT NULL,
    narration character varying(200),
    ref_voucher_no character varying(50),
    status boolean NOT NULL,
    user_created character varying(50),
    date_created timestamp with time zone NOT NULL,
    user_modified character varying(50),
    date_modified timestamp with time zone NOT NULL,
    "BankAccount" bigint,
    posting_status character varying(20) NOT NULL,
    CONSTRAINT chk_b2_amount_positive CHECK ((amount >= 0.00)),
    CONSTRAINT chk_b2_posting_status CHECK (((posting_status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('PENDING'::character varying)::text, ('POSTED'::character varying)::text]))),
    CONSTRAINT chk_b2_rpid CHECK (((rpid)::text = ANY (ARRAY[('R'::character varying)::text, ('P'::character varying)::text, ('I'::character varying)::text, ('D'::character varying)::text]))),
    CONSTRAINT chk_b2_trantype CHECK (((tran_type)::text = ANY (ARRAY[('CASH'::character varying)::text, ('BANK'::character varying)::text])))
);


ALTER TABLE public."tblSubsectionB2" OWNER TO alpha_user;

--
-- Name: tblSubsectionB2_TRAN; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblSubsectionB2_TRAN" (
    id bigint NOT NULL,
    transaction_date timestamp with time zone CONSTRAINT "tblSubsectionB2_TRAN_date_not_null" NOT NULL,
    tran_type character varying(4) NOT NULL,
    rpid character varying(1) NOT NULL,
    amount numeric(15,2) NOT NULL,
    remarks character varying(200),
    cost_center character varying(50),
    user_created character varying(50),
    date_created timestamp with time zone,
    user_modified character varying(50),
    date_modified timestamp with time zone,
    accountmaster_id bigint,
    "VoucherNo" character varying(50) NOT NULL,
    chq_date date,
    chq_no character varying(50),
    payee_bank character varying(100),
    CONSTRAINT chk_b2_tran_amount CHECK ((amount >= 0.00)),
    CONSTRAINT chk_b2_tran_rpid CHECK (((rpid)::text = ANY (ARRAY[('R'::character varying)::text, ('P'::character varying)::text, ('I'::character varying)::text, ('D'::character varying)::text]))),
    CONSTRAINT chk_b2_tran_trantype CHECK (((tran_type)::text = ANY (ARRAY[('CASH'::character varying)::text, ('BANK'::character varying)::text])))
);


ALTER TABLE public."tblSubsectionB2_TRAN" OWNER TO alpha_user;

--
-- Name: tblSubsectionB2_TRAN_id_seq; Type: SEQUENCE; Schema: public; Owner: alpha_user
--

ALTER TABLE public."tblSubsectionB2_TRAN" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."tblSubsectionB2_TRAN_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tblUserMaster; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblUserMaster" (
    user_id character varying(50) NOT NULL,
    user_name character varying(150) NOT NULL,
    role character varying(20) NOT NULL,
    empid character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    user_created character varying(50),
    date_created timestamp with time zone NOT NULL,
    user_modified character varying(50),
    date_modified timestamp with time zone NOT NULL
);


ALTER TABLE public."tblUserMaster" OWNER TO alpha_user;

--
-- Name: tblVendorSupplier; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblVendorSupplier" (
    "VendorSupplierID" bigint NOT NULL,
    "VendorSupplierName" character varying,
    "Address1" character varying,
    "Address2" character varying,
    "ContactNo" character varying,
    "GSTNo" character varying,
    "PANo" character varying(10),
    "UserCreted" character varying,
    "DateCreated" timestamp with time zone,
    "UserModified" character varying,
    "DateModified" timestamp with time zone
);


ALTER TABLE public."tblVendorSupplier" OWNER TO alpha_user;

--
-- Name: tblZone; Type: TABLE; Schema: public; Owner: alpha_user
--

CREATE TABLE public."tblZone" (
    "ZoneID" bigint NOT NULL,
    "ZoneName" character varying,
    "UserCreated" character varying,
    "DateCreated" timestamp with time zone,
    "UserModified" character varying,
    "DateModified" timestamp with time zone
);


ALTER TABLE public."tblZone" OWNER TO alpha_user;

--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: alpha_user
--



--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: alpha_user
--



--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public.auth_permission VALUES (1, 'Can add log entry', 1, 'add_logentry');
INSERT INTO public.auth_permission VALUES (2, 'Can change log entry', 1, 'change_logentry');
INSERT INTO public.auth_permission VALUES (3, 'Can delete log entry', 1, 'delete_logentry');
INSERT INTO public.auth_permission VALUES (4, 'Can view log entry', 1, 'view_logentry');
INSERT INTO public.auth_permission VALUES (5, 'Can add permission', 3, 'add_permission');
INSERT INTO public.auth_permission VALUES (6, 'Can change permission', 3, 'change_permission');
INSERT INTO public.auth_permission VALUES (7, 'Can delete permission', 3, 'delete_permission');
INSERT INTO public.auth_permission VALUES (8, 'Can view permission', 3, 'view_permission');
INSERT INTO public.auth_permission VALUES (9, 'Can add group', 2, 'add_group');
INSERT INTO public.auth_permission VALUES (10, 'Can change group', 2, 'change_group');
INSERT INTO public.auth_permission VALUES (11, 'Can delete group', 2, 'delete_group');
INSERT INTO public.auth_permission VALUES (12, 'Can view group', 2, 'view_group');
INSERT INTO public.auth_permission VALUES (13, 'Can add user', 4, 'add_user');
INSERT INTO public.auth_permission VALUES (14, 'Can change user', 4, 'change_user');
INSERT INTO public.auth_permission VALUES (15, 'Can delete user', 4, 'delete_user');
INSERT INTO public.auth_permission VALUES (16, 'Can view user', 4, 'view_user');
INSERT INTO public.auth_permission VALUES (17, 'Can add content type', 5, 'add_contenttype');
INSERT INTO public.auth_permission VALUES (18, 'Can change content type', 5, 'change_contenttype');
INSERT INTO public.auth_permission VALUES (19, 'Can delete content type', 5, 'delete_contenttype');
INSERT INTO public.auth_permission VALUES (20, 'Can view content type', 5, 'view_contenttype');
INSERT INTO public.auth_permission VALUES (21, 'Can add session', 6, 'add_session');
INSERT INTO public.auth_permission VALUES (22, 'Can change session', 6, 'change_session');
INSERT INTO public.auth_permission VALUES (23, 'Can delete session', 6, 'delete_session');
INSERT INTO public.auth_permission VALUES (24, 'Can view session', 6, 'view_session');
INSERT INTO public.auth_permission VALUES (25, 'Can add Category', 10, 'add_category');
INSERT INTO public.auth_permission VALUES (26, 'Can change Category', 10, 'change_category');
INSERT INTO public.auth_permission VALUES (27, 'Can delete Category', 10, 'delete_category');
INSERT INTO public.auth_permission VALUES (28, 'Can view Category', 10, 'view_category');
INSERT INTO public.auth_permission VALUES (29, 'Can add Voucher', 17, 'add_voucher');
INSERT INTO public.auth_permission VALUES (30, 'Can change Voucher', 17, 'change_voucher');
INSERT INTO public.auth_permission VALUES (31, 'Can delete Voucher', 17, 'delete_voucher');
INSERT INTO public.auth_permission VALUES (32, 'Can view Voucher', 17, 'view_voucher');
INSERT INTO public.auth_permission VALUES (33, 'Can add Alpha Record', 7, 'add_alpha');
INSERT INTO public.auth_permission VALUES (34, 'Can change Alpha Record', 7, 'change_alpha');
INSERT INTO public.auth_permission VALUES (35, 'Can delete Alpha Record', 7, 'delete_alpha');
INSERT INTO public.auth_permission VALUES (36, 'Can view Alpha Record', 7, 'view_alpha');
INSERT INTO public.auth_permission VALUES (37, 'Can add Voucher Fact', 18, 'add_voucherfact');
INSERT INTO public.auth_permission VALUES (38, 'Can change Voucher Fact', 18, 'change_voucherfact');
INSERT INTO public.auth_permission VALUES (39, 'Can delete Voucher Fact', 18, 'delete_voucherfact');
INSERT INTO public.auth_permission VALUES (40, 'Can view Voucher Fact', 18, 'view_voucherfact');
INSERT INTO public.auth_permission VALUES (41, 'Can add Cash/Bank Transaction', 8, 'add_cashbank');
INSERT INTO public.auth_permission VALUES (42, 'Can change Cash/Bank Transaction', 8, 'change_cashbank');
INSERT INTO public.auth_permission VALUES (43, 'Can delete Cash/Bank Transaction', 8, 'delete_cashbank');
INSERT INTO public.auth_permission VALUES (44, 'Can view Cash/Bank Transaction', 8, 'view_cashbank');
INSERT INTO public.auth_permission VALUES (45, 'Can add Cash/Bank Detail', 9, 'add_cashbanktran');
INSERT INTO public.auth_permission VALUES (46, 'Can change Cash/Bank Detail', 9, 'change_cashbanktran');
INSERT INTO public.auth_permission VALUES (47, 'Can delete Cash/Bank Detail', 9, 'delete_cashbanktran');
INSERT INTO public.auth_permission VALUES (48, 'Can view Cash/Bank Detail', 9, 'view_cashbanktran');
INSERT INTO public.auth_permission VALUES (49, 'Can add Section C Transaction', 13, 'add_sectionc');
INSERT INTO public.auth_permission VALUES (50, 'Can change Section C Transaction', 13, 'change_sectionc');
INSERT INTO public.auth_permission VALUES (51, 'Can delete Section C Transaction', 13, 'delete_sectionc');
INSERT INTO public.auth_permission VALUES (52, 'Can view Section C Transaction', 13, 'view_sectionc');
INSERT INTO public.auth_permission VALUES (53, 'Can add Section C Detail', 14, 'add_sectionctran');
INSERT INTO public.auth_permission VALUES (54, 'Can change Section C Detail', 14, 'change_sectionctran');
INSERT INTO public.auth_permission VALUES (55, 'Can delete Section C Detail', 14, 'delete_sectionctran');
INSERT INTO public.auth_permission VALUES (56, 'Can view Section C Detail', 14, 'view_sectionctran');
INSERT INTO public.auth_permission VALUES (57, 'Can add Sub Section B-2 Transaction', 15, 'add_subsectionb2');
INSERT INTO public.auth_permission VALUES (58, 'Can change Sub Section B-2 Transaction', 15, 'change_subsectionb2');
INSERT INTO public.auth_permission VALUES (59, 'Can delete Sub Section B-2 Transaction', 15, 'delete_subsectionb2');
INSERT INTO public.auth_permission VALUES (60, 'Can view Sub Section B-2 Transaction', 15, 'view_subsectionb2');
INSERT INTO public.auth_permission VALUES (61, 'Can add Sub Section B-2 Detail', 16, 'add_subsectionb2tran');
INSERT INTO public.auth_permission VALUES (62, 'Can change Sub Section B-2 Detail', 16, 'change_subsectionb2tran');
INSERT INTO public.auth_permission VALUES (63, 'Can delete Sub Section B-2 Detail', 16, 'delete_subsectionb2tran');
INSERT INTO public.auth_permission VALUES (64, 'Can view Sub Section B-2 Detail', 16, 'view_subsectionb2tran');
INSERT INTO public.auth_permission VALUES (65, 'Can add Material', 12, 'add_material');
INSERT INTO public.auth_permission VALUES (66, 'Can change Material', 12, 'change_material');
INSERT INTO public.auth_permission VALUES (67, 'Can delete Material', 12, 'delete_material');
INSERT INTO public.auth_permission VALUES (68, 'Can view Material', 12, 'view_material');
INSERT INTO public.auth_permission VALUES (69, 'Can add Gate Entry', 11, 'add_gateentry');
INSERT INTO public.auth_permission VALUES (70, 'Can change Gate Entry', 11, 'change_gateentry');
INSERT INTO public.auth_permission VALUES (71, 'Can delete Gate Entry', 11, 'delete_gateentry');
INSERT INTO public.auth_permission VALUES (72, 'Can view Gate Entry', 11, 'view_gateentry');
INSERT INTO public.auth_permission VALUES (73, 'Can add Purchase Order', 19, 'add_purchaseorder');
INSERT INTO public.auth_permission VALUES (74, 'Can change Purchase Order', 19, 'change_purchaseorder');
INSERT INTO public.auth_permission VALUES (75, 'Can delete Purchase Order', 19, 'delete_purchaseorder');
INSERT INTO public.auth_permission VALUES (76, 'Can view Purchase Order', 19, 'view_purchaseorder');
INSERT INTO public.auth_permission VALUES (77, 'Can add Purchase Order Detail', 20, 'add_purchaseorderitem');
INSERT INTO public.auth_permission VALUES (78, 'Can change Purchase Order Detail', 20, 'change_purchaseorderitem');
INSERT INTO public.auth_permission VALUES (79, 'Can delete Purchase Order Detail', 20, 'delete_purchaseorderitem');
INSERT INTO public.auth_permission VALUES (80, 'Can view Purchase Order Detail', 20, 'view_purchaseorderitem');
INSERT INTO public.auth_permission VALUES (81, 'Can add vendor supplier', 22, 'add_vendorsupplier');
INSERT INTO public.auth_permission VALUES (82, 'Can change vendor supplier', 22, 'change_vendorsupplier');
INSERT INTO public.auth_permission VALUES (83, 'Can delete vendor supplier', 22, 'delete_vendorsupplier');
INSERT INTO public.auth_permission VALUES (84, 'Can view vendor supplier', 22, 'view_vendorsupplier');
INSERT INTO public.auth_permission VALUES (85, 'Can add broker', 21, 'add_broker');
INSERT INTO public.auth_permission VALUES (86, 'Can change broker', 21, 'change_broker');
INSERT INTO public.auth_permission VALUES (87, 'Can delete broker', 21, 'delete_broker');
INSERT INTO public.auth_permission VALUES (88, 'Can view broker', 21, 'view_broker');
INSERT INTO public.auth_permission VALUES (89, 'Can add Alpha Record', 7, 'add_accountmaster');
INSERT INTO public.auth_permission VALUES (90, 'Can change Alpha Record', 7, 'change_accountmaster');
INSERT INTO public.auth_permission VALUES (91, 'Can delete Alpha Record', 7, 'delete_accountmaster');
INSERT INTO public.auth_permission VALUES (92, 'Can view Alpha Record', 7, 'view_accountmaster');
INSERT INTO public.auth_permission VALUES (93, 'Can add Sales/Purchase Group', 23, 'add_salpurgroup');
INSERT INTO public.auth_permission VALUES (94, 'Can change Sales/Purchase Group', 23, 'change_salpurgroup');
INSERT INTO public.auth_permission VALUES (95, 'Can delete Sales/Purchase Group', 23, 'delete_salpurgroup');
INSERT INTO public.auth_permission VALUES (96, 'Can view Sales/Purchase Group', 23, 'view_salpurgroup');
INSERT INTO public.auth_permission VALUES (97, 'Can add Sales/Purchase Group Transaction', 24, 'add_salpurgrouptran');
INSERT INTO public.auth_permission VALUES (98, 'Can change Sales/Purchase Group Transaction', 24, 'change_salpurgrouptran');
INSERT INTO public.auth_permission VALUES (99, 'Can delete Sales/Purchase Group Transaction', 24, 'delete_salpurgrouptran');
INSERT INTO public.auth_permission VALUES (100, 'Can view Sales/Purchase Group Transaction', 24, 'view_salpurgrouptran');
INSERT INTO public.auth_permission VALUES (101, 'Can add Purchase/Sales Header', 25, 'add_pursales');
INSERT INTO public.auth_permission VALUES (102, 'Can change Purchase/Sales Header', 25, 'change_pursales');
INSERT INTO public.auth_permission VALUES (103, 'Can delete Purchase/Sales Header', 25, 'delete_pursales');
INSERT INTO public.auth_permission VALUES (104, 'Can view Purchase/Sales Header', 25, 'view_pursales');
INSERT INTO public.auth_permission VALUES (105, 'Can add Purchase/Sales Detail', 26, 'add_pursalestran');
INSERT INTO public.auth_permission VALUES (106, 'Can change Purchase/Sales Detail', 26, 'change_pursalestran');
INSERT INTO public.auth_permission VALUES (107, 'Can delete Purchase/Sales Detail', 26, 'delete_pursalestran');
INSERT INTO public.auth_permission VALUES (108, 'Can view Purchase/Sales Detail', 26, 'view_pursalestran');
INSERT INTO public.auth_permission VALUES (109, 'Can add zone', 27, 'add_zone');
INSERT INTO public.auth_permission VALUES (110, 'Can change zone', 27, 'change_zone');
INSERT INTO public.auth_permission VALUES (111, 'Can delete zone', 27, 'delete_zone');
INSERT INTO public.auth_permission VALUES (112, 'Can view zone', 27, 'view_zone');
INSERT INTO public.auth_permission VALUES (113, 'Can add User Master', 28, 'add_usermaster');
INSERT INTO public.auth_permission VALUES (114, 'Can change User Master', 28, 'change_usermaster');
INSERT INTO public.auth_permission VALUES (115, 'Can delete User Master', 28, 'delete_usermaster');
INSERT INTO public.auth_permission VALUES (116, 'Can view User Master', 28, 'view_usermaster');


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public.auth_user VALUES (1, '', NULL, false, 'test_user', '', '', '', false, true, '2026-06-16 09:22:36.338621+05:30');


--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: alpha_user
--



--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: alpha_user
--



--
-- Data for Name: dashboard_voucher; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public.dashboard_voucher VALUES (1, '40000015', '2026-05-04', 'sa', true, '2026-05-29 22:16:35.366834+05:30', '2026-05-29 22:16:35.366834+05:30');
INSERT INTO public.dashboard_voucher VALUES (4, '123', '2026-05-10', '', true, '2026-05-29 22:18:15.921733+05:30', '2026-06-01 17:19:17.414393+05:30');
INSERT INTO public.dashboard_voucher VALUES (5, '12', '2026-06-08', '', true, '2026-06-02 13:33:45.424911+05:30', '2026-06-02 13:33:45.424911+05:30');
INSERT INTO public.dashboard_voucher VALUES (6, 'V-SEED-001', '2026-06-02', 'Seeded voucher remark 1', true, '2026-06-02 13:45:25.221106+05:30', '2026-06-02 13:45:25.221106+05:30');
INSERT INTO public.dashboard_voucher VALUES (7, 'V-SEED-002', '2026-06-02', 'Seeded voucher remark 2', true, '2026-06-02 13:45:25.221106+05:30', '2026-06-02 13:45:25.221106+05:30');
INSERT INTO public.dashboard_voucher VALUES (8, 'V-SEED-003', '2026-06-02', 'Seeded voucher remark 3', true, '2026-06-02 13:45:25.221106+05:30', '2026-06-02 13:45:25.221106+05:30');
INSERT INTO public.dashboard_voucher VALUES (9, 'V-SEED-004', '2026-06-02', 'Seeded voucher remark 4', true, '2026-06-02 13:45:25.22869+05:30', '2026-06-02 13:45:25.22869+05:30');
INSERT INTO public.dashboard_voucher VALUES (10, 'V-SEED-005', '2026-06-02', 'Seeded voucher remark 5', true, '2026-06-02 13:45:25.22869+05:30', '2026-06-02 13:45:25.22869+05:30');
INSERT INTO public.dashboard_voucher VALUES (11, 'V-SEED-006', '2026-06-02', 'Seeded voucher remark 6', true, '2026-06-02 13:45:25.233796+05:30', '2026-06-02 13:45:25.233796+05:30');
INSERT INTO public.dashboard_voucher VALUES (12, 'V-SEED-007', '2026-06-02', 'Seeded voucher remark 7', true, '2026-06-02 13:45:25.237113+05:30', '2026-06-02 13:45:25.237113+05:30');
INSERT INTO public.dashboard_voucher VALUES (13, 'V-SEED-008', '2026-06-02', 'Seeded voucher remark 8', true, '2026-06-02 13:45:25.237113+05:30', '2026-06-02 13:45:25.237113+05:30');
INSERT INTO public.dashboard_voucher VALUES (14, 'V-SEED-009', '2026-06-02', 'Seeded voucher remark 9', true, '2026-06-02 13:45:25.237113+05:30', '2026-06-02 13:45:25.237113+05:30');
INSERT INTO public.dashboard_voucher VALUES (15, 'V-SEED-010', '2026-06-02', 'Seeded voucher remark 10', true, '2026-06-02 13:45:25.237113+05:30', '2026-06-02 13:45:25.237113+05:30');
INSERT INTO public.dashboard_voucher VALUES (16, 'V-SEED-011', '2026-06-02', 'Seeded voucher remark 11', true, '2026-06-02 13:45:25.237113+05:30', '2026-06-02 13:45:25.237113+05:30');
INSERT INTO public.dashboard_voucher VALUES (17, 'V-SEED-012', '2026-06-02', 'Seeded voucher remark 12', true, '2026-06-02 13:45:25.245501+05:30', '2026-06-02 13:45:25.245501+05:30');
INSERT INTO public.dashboard_voucher VALUES (18, 'V-SEED-013', '2026-06-02', 'Seeded voucher remark 13', true, '2026-06-02 13:45:25.248387+05:30', '2026-06-02 13:45:25.248387+05:30');
INSERT INTO public.dashboard_voucher VALUES (19, 'V-SEED-014', '2026-06-02', 'Seeded voucher remark 14', true, '2026-06-02 13:45:25.249643+05:30', '2026-06-02 13:45:25.249643+05:30');
INSERT INTO public.dashboard_voucher VALUES (20, 'V-SEED-015', '2026-06-02', 'Seeded voucher remark 15', true, '2026-06-02 13:45:25.249643+05:30', '2026-06-02 13:45:25.249643+05:30');
INSERT INTO public.dashboard_voucher VALUES (21, 'V-SEED-016', '2026-06-02', 'Seeded voucher remark 16', true, '2026-06-02 13:45:25.249643+05:30', '2026-06-02 13:45:25.249643+05:30');
INSERT INTO public.dashboard_voucher VALUES (22, 'V-SEED-017', '2026-06-02', 'Seeded voucher remark 17', true, '2026-06-02 13:45:25.249643+05:30', '2026-06-02 13:45:25.249643+05:30');
INSERT INTO public.dashboard_voucher VALUES (23, 'V-SEED-018', '2026-06-02', 'Seeded voucher remark 18', true, '2026-06-02 13:45:25.25439+05:30', '2026-06-02 13:45:25.25439+05:30');
INSERT INTO public.dashboard_voucher VALUES (24, 'V-SEED-019', '2026-06-02', 'Seeded voucher remark 19', true, '2026-06-02 13:45:25.25439+05:30', '2026-06-02 13:45:25.25439+05:30');
INSERT INTO public.dashboard_voucher VALUES (25, 'V-SEED-020', '2026-06-02', 'Seeded voucher remark 20', true, '2026-06-02 13:45:25.25439+05:30', '2026-06-02 13:45:25.25439+05:30');
INSERT INTO public.dashboard_voucher VALUES (26, 'V-SEED-021', '2026-06-02', 'Seeded voucher remark 21', true, '2026-06-02 13:45:25.25439+05:30', '2026-06-02 13:45:25.25439+05:30');
INSERT INTO public.dashboard_voucher VALUES (27, 'V-SEED-022', '2026-06-02', 'Seeded voucher remark 22', true, '2026-06-02 13:45:25.261379+05:30', '2026-06-02 13:45:25.261379+05:30');
INSERT INTO public.dashboard_voucher VALUES (28, 'V-SEED-023', '2026-06-02', 'Seeded voucher remark 23', true, '2026-06-02 13:45:25.261379+05:30', '2026-06-02 13:45:25.261379+05:30');
INSERT INTO public.dashboard_voucher VALUES (29, 'V-SEED-024', '2026-06-02', 'Seeded voucher remark 24', true, '2026-06-02 13:45:25.261379+05:30', '2026-06-02 13:45:25.261379+05:30');
INSERT INTO public.dashboard_voucher VALUES (30, 'V-SEED-025', '2026-06-02', 'Seeded voucher remark 25', true, '2026-06-02 13:45:25.271286+05:30', '2026-06-02 13:45:25.271286+05:30');
INSERT INTO public.dashboard_voucher VALUES (31, 'V-SEED-026', '2026-06-02', 'Seeded voucher remark 26', true, '2026-06-02 13:45:25.271286+05:30', '2026-06-02 13:45:25.271286+05:30');
INSERT INTO public.dashboard_voucher VALUES (32, 'V-SEED-027', '2026-06-02', 'Seeded voucher remark 27', true, '2026-06-02 13:45:25.271286+05:30', '2026-06-02 13:45:25.271286+05:30');
INSERT INTO public.dashboard_voucher VALUES (33, 'V-SEED-028', '2026-06-02', 'Seeded voucher remark 28', true, '2026-06-02 13:45:25.271286+05:30', '2026-06-02 13:45:25.271286+05:30');
INSERT INTO public.dashboard_voucher VALUES (34, 'V-SEED-029', '2026-06-02', 'Seeded voucher remark 29', true, '2026-06-02 13:45:25.278254+05:30', '2026-06-02 13:45:25.278254+05:30');
INSERT INTO public.dashboard_voucher VALUES (35, 'V-SEED-030', '2026-06-02', 'Seeded voucher remark 30', true, '2026-06-02 13:45:25.278254+05:30', '2026-06-02 13:45:25.278254+05:30');
INSERT INTO public.dashboard_voucher VALUES (36, 'V-SEED-031', '2026-06-02', 'Seeded voucher remark 31', true, '2026-06-02 13:45:25.278254+05:30', '2026-06-02 13:45:25.278254+05:30');
INSERT INTO public.dashboard_voucher VALUES (37, 'V-SEED-032', '2026-06-02', 'Seeded voucher remark 32', true, '2026-06-02 13:45:25.278254+05:30', '2026-06-02 13:45:25.278254+05:30');
INSERT INTO public.dashboard_voucher VALUES (38, 'V-SEED-033', '2026-06-02', 'Seeded voucher remark 33', true, '2026-06-02 13:45:25.278254+05:30', '2026-06-02 13:45:25.278254+05:30');
INSERT INTO public.dashboard_voucher VALUES (39, 'V-SEED-034', '2026-06-02', 'Seeded voucher remark 34', true, '2026-06-02 13:45:25.285943+05:30', '2026-06-02 13:45:25.285943+05:30');
INSERT INTO public.dashboard_voucher VALUES (40, 'V-SEED-035', '2026-06-02', 'Seeded voucher remark 35', true, '2026-06-02 13:45:25.285943+05:30', '2026-06-02 13:45:25.285943+05:30');
INSERT INTO public.dashboard_voucher VALUES (41, 'V-SEED-036', '2026-06-02', 'Seeded voucher remark 36', true, '2026-06-02 13:45:25.285943+05:30', '2026-06-02 13:45:25.285943+05:30');


--
-- Data for Name: dashboard_voucherfact; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public.dashboard_voucherfact VALUES (1, 'A', 2333.00, 10, 1, 'sa', '2026-05-04');
INSERT INTO public.dashboard_voucherfact VALUES (2, 'B', 2333.00, 9, 1, 'sa', '2026-05-04');
INSERT INTO public.dashboard_voucherfact VALUES (7, 'A', 122.00, 9, 4, '', '2026-05-10');
INSERT INTO public.dashboard_voucherfact VALUES (8, 'B', 122.00, 8, 4, '', '2026-05-10');
INSERT INTO public.dashboard_voucherfact VALUES (9, 'A', 333.00, 15, 5, '', '2026-06-08');
INSERT INTO public.dashboard_voucherfact VALUES (10, 'B', 333.00, 14, 5, '', '2026-06-08');
INSERT INTO public.dashboard_voucherfact VALUES (11, 'A', 100.00, 17, 6, 'Seeded voucher remark 1', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (12, 'B', 100.00, 17, 6, 'Seeded voucher remark 1', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (13, 'A', 200.00, 17, 7, 'Seeded voucher remark 2', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (14, 'B', 200.00, 17, 7, 'Seeded voucher remark 2', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (15, 'A', 300.00, 17, 8, 'Seeded voucher remark 3', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (16, 'B', 300.00, 17, 8, 'Seeded voucher remark 3', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (17, 'A', 400.00, 17, 9, 'Seeded voucher remark 4', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (18, 'B', 400.00, 17, 9, 'Seeded voucher remark 4', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (19, 'A', 500.00, 17, 10, 'Seeded voucher remark 5', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (20, 'B', 500.00, 17, 10, 'Seeded voucher remark 5', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (21, 'A', 600.00, 17, 11, 'Seeded voucher remark 6', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (22, 'B', 600.00, 17, 11, 'Seeded voucher remark 6', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (23, 'A', 700.00, 17, 12, 'Seeded voucher remark 7', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (24, 'B', 700.00, 17, 12, 'Seeded voucher remark 7', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (25, 'A', 800.00, 17, 13, 'Seeded voucher remark 8', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (26, 'B', 800.00, 17, 13, 'Seeded voucher remark 8', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (27, 'A', 900.00, 17, 14, 'Seeded voucher remark 9', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (28, 'B', 900.00, 17, 14, 'Seeded voucher remark 9', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (29, 'A', 1000.00, 17, 15, 'Seeded voucher remark 10', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (30, 'B', 1000.00, 17, 15, 'Seeded voucher remark 10', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (31, 'A', 1100.00, 17, 16, 'Seeded voucher remark 11', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (32, 'B', 1100.00, 17, 16, 'Seeded voucher remark 11', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (33, 'A', 1200.00, 17, 17, 'Seeded voucher remark 12', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (34, 'B', 1200.00, 17, 17, 'Seeded voucher remark 12', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (35, 'A', 1300.00, 17, 18, 'Seeded voucher remark 13', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (36, 'B', 1300.00, 17, 18, 'Seeded voucher remark 13', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (37, 'A', 1400.00, 17, 19, 'Seeded voucher remark 14', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (38, 'B', 1400.00, 17, 19, 'Seeded voucher remark 14', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (39, 'A', 1500.00, 17, 20, 'Seeded voucher remark 15', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (40, 'B', 1500.00, 17, 20, 'Seeded voucher remark 15', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (41, 'A', 1600.00, 17, 21, 'Seeded voucher remark 16', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (42, 'B', 1600.00, 17, 21, 'Seeded voucher remark 16', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (43, 'A', 1700.00, 17, 22, 'Seeded voucher remark 17', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (44, 'B', 1700.00, 17, 22, 'Seeded voucher remark 17', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (45, 'A', 1800.00, 17, 23, 'Seeded voucher remark 18', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (46, 'B', 1800.00, 17, 23, 'Seeded voucher remark 18', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (47, 'A', 1900.00, 17, 24, 'Seeded voucher remark 19', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (48, 'B', 1900.00, 17, 24, 'Seeded voucher remark 19', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (49, 'A', 2000.00, 17, 25, 'Seeded voucher remark 20', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (50, 'B', 2000.00, 17, 25, 'Seeded voucher remark 20', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (51, 'A', 2100.00, 17, 26, 'Seeded voucher remark 21', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (52, 'B', 2100.00, 17, 26, 'Seeded voucher remark 21', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (53, 'A', 2200.00, 17, 27, 'Seeded voucher remark 22', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (54, 'B', 2200.00, 17, 27, 'Seeded voucher remark 22', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (55, 'A', 2300.00, 17, 28, 'Seeded voucher remark 23', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (56, 'B', 2300.00, 17, 28, 'Seeded voucher remark 23', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (57, 'A', 2400.00, 17, 29, 'Seeded voucher remark 24', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (58, 'B', 2400.00, 17, 29, 'Seeded voucher remark 24', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (59, 'A', 2500.00, 17, 30, 'Seeded voucher remark 25', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (60, 'B', 2500.00, 17, 30, 'Seeded voucher remark 25', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (61, 'A', 2600.00, 17, 31, 'Seeded voucher remark 26', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (62, 'B', 2600.00, 17, 31, 'Seeded voucher remark 26', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (63, 'A', 2700.00, 17, 32, 'Seeded voucher remark 27', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (64, 'B', 2700.00, 17, 32, 'Seeded voucher remark 27', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (65, 'A', 2800.00, 17, 33, 'Seeded voucher remark 28', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (66, 'B', 2800.00, 17, 33, 'Seeded voucher remark 28', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (67, 'A', 2900.00, 17, 34, 'Seeded voucher remark 29', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (68, 'B', 2900.00, 17, 34, 'Seeded voucher remark 29', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (69, 'A', 3000.00, 17, 35, 'Seeded voucher remark 30', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (70, 'B', 3000.00, 17, 35, 'Seeded voucher remark 30', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (71, 'A', 3100.00, 17, 36, 'Seeded voucher remark 31', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (72, 'B', 3100.00, 17, 36, 'Seeded voucher remark 31', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (73, 'A', 3200.00, 17, 37, 'Seeded voucher remark 32', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (74, 'B', 3200.00, 17, 37, 'Seeded voucher remark 32', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (75, 'A', 3300.00, 17, 38, 'Seeded voucher remark 33', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (76, 'B', 3300.00, 17, 38, 'Seeded voucher remark 33', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (77, 'A', 3400.00, 17, 39, 'Seeded voucher remark 34', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (78, 'B', 3400.00, 17, 39, 'Seeded voucher remark 34', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (79, 'A', 3500.00, 17, 40, 'Seeded voucher remark 35', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (80, 'B', 3500.00, 17, 40, 'Seeded voucher remark 35', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (81, 'A', 3600.00, 17, 41, 'Seeded voucher remark 36', '2026-06-02');
INSERT INTO public.dashboard_voucherfact VALUES (82, 'B', 3600.00, 17, 41, 'Seeded voucher remark 36', '2026-06-02');


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: alpha_user
--



--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public.django_content_type VALUES (1, 'admin', 'logentry');
INSERT INTO public.django_content_type VALUES (2, 'auth', 'group');
INSERT INTO public.django_content_type VALUES (3, 'auth', 'permission');
INSERT INTO public.django_content_type VALUES (4, 'auth', 'user');
INSERT INTO public.django_content_type VALUES (5, 'contenttypes', 'contenttype');
INSERT INTO public.django_content_type VALUES (6, 'sessions', 'session');
INSERT INTO public.django_content_type VALUES (8, 'dashboard', 'cashbank');
INSERT INTO public.django_content_type VALUES (9, 'dashboard', 'cashbanktran');
INSERT INTO public.django_content_type VALUES (10, 'dashboard', 'category');
INSERT INTO public.django_content_type VALUES (11, 'dashboard', 'gateentry');
INSERT INTO public.django_content_type VALUES (12, 'dashboard', 'material');
INSERT INTO public.django_content_type VALUES (13, 'dashboard', 'sectionc');
INSERT INTO public.django_content_type VALUES (14, 'dashboard', 'sectionctran');
INSERT INTO public.django_content_type VALUES (15, 'dashboard', 'subsectionb2');
INSERT INTO public.django_content_type VALUES (16, 'dashboard', 'subsectionb2tran');
INSERT INTO public.django_content_type VALUES (17, 'dashboard', 'voucher');
INSERT INTO public.django_content_type VALUES (18, 'dashboard', 'voucherfact');
INSERT INTO public.django_content_type VALUES (19, 'dashboard', 'purchaseorder');
INSERT INTO public.django_content_type VALUES (20, 'dashboard', 'purchaseorderitem');
INSERT INTO public.django_content_type VALUES (21, 'dashboard', 'broker');
INSERT INTO public.django_content_type VALUES (22, 'dashboard', 'vendorsupplier');
INSERT INTO public.django_content_type VALUES (7, 'dashboard', 'accountmaster');
INSERT INTO public.django_content_type VALUES (23, 'dashboard', 'salpurgroup');
INSERT INTO public.django_content_type VALUES (24, 'dashboard', 'salpurgrouptran');
INSERT INTO public.django_content_type VALUES (25, 'dashboard', 'pursales');
INSERT INTO public.django_content_type VALUES (26, 'dashboard', 'pursalestran');
INSERT INTO public.django_content_type VALUES (27, 'dashboard', 'zone');
INSERT INTO public.django_content_type VALUES (28, 'dashboard', 'usermaster');


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public.django_migrations VALUES (1, 'contenttypes', '0001_initial', '2026-05-29 13:30:09.17596+05:30');
INSERT INTO public.django_migrations VALUES (2, 'auth', '0001_initial', '2026-05-29 13:30:09.252268+05:30');
INSERT INTO public.django_migrations VALUES (3, 'admin', '0001_initial', '2026-05-29 13:30:09.275477+05:30');
INSERT INTO public.django_migrations VALUES (4, 'admin', '0002_logentry_remove_auto_add', '2026-05-29 13:30:09.283999+05:30');
INSERT INTO public.django_migrations VALUES (5, 'admin', '0003_logentry_add_action_flag_choices', '2026-05-29 13:30:09.287976+05:30');
INSERT INTO public.django_migrations VALUES (6, 'contenttypes', '0002_remove_content_type_name', '2026-05-29 13:30:09.299217+05:30');
INSERT INTO public.django_migrations VALUES (7, 'auth', '0002_alter_permission_name_max_length', '2026-05-29 13:30:09.3082+05:30');
INSERT INTO public.django_migrations VALUES (8, 'auth', '0003_alter_user_email_max_length', '2026-05-29 13:30:09.316718+05:30');
INSERT INTO public.django_migrations VALUES (9, 'auth', '0004_alter_user_username_opts', '2026-05-29 13:30:09.320547+05:30');
INSERT INTO public.django_migrations VALUES (10, 'auth', '0005_alter_user_last_login_null', '2026-05-29 13:30:09.328214+05:30');
INSERT INTO public.django_migrations VALUES (11, 'auth', '0006_require_contenttypes_0002', '2026-05-29 13:30:09.329265+05:30');
INSERT INTO public.django_migrations VALUES (12, 'auth', '0007_alter_validators_add_error_messages', '2026-05-29 13:30:09.334076+05:30');
INSERT INTO public.django_migrations VALUES (13, 'auth', '0008_alter_user_username_max_length', '2026-05-29 13:30:09.348175+05:30');
INSERT INTO public.django_migrations VALUES (14, 'auth', '0009_alter_user_last_name_max_length', '2026-05-29 13:30:09.35462+05:30');
INSERT INTO public.django_migrations VALUES (15, 'auth', '0010_alter_group_name_max_length', '2026-05-29 13:30:09.363403+05:30');
INSERT INTO public.django_migrations VALUES (16, 'auth', '0011_update_proxy_permissions', '2026-05-29 13:30:09.368075+05:30');
INSERT INTO public.django_migrations VALUES (17, 'auth', '0012_alter_user_first_name_max_length', '2026-05-29 13:30:09.375615+05:30');
INSERT INTO public.django_migrations VALUES (18, 'dashboard', '0001_initial', '2026-05-29 13:30:09.419395+05:30');
INSERT INTO public.django_migrations VALUES (19, 'dashboard', '0002_alter_alpha_alpha_name', '2026-05-29 13:30:09.430413+05:30');
INSERT INTO public.django_migrations VALUES (20, 'dashboard', '0003_alter_voucher_voucher_number', '2026-05-29 13:30:09.443826+05:30');
INSERT INTO public.django_migrations VALUES (21, 'dashboard', '0004_voucherfact_remarks_voucherfact_voucher_date_and_more', '2026-05-29 13:30:09.554293+05:30');
INSERT INTO public.django_migrations VALUES (22, 'dashboard', '0005_cashbank_alter_voucherfact_row_type_cashbanktran', '2026-05-29 13:30:09.608118+05:30');
INSERT INTO public.django_migrations VALUES (23, 'dashboard', '0006_cashbanktran_alpha_group', '2026-05-29 13:30:09.616562+05:30');
INSERT INTO public.django_migrations VALUES (24, 'dashboard', '0007_sectionc_alter_alpha_id_alter_cashbanktran_id_and_more', '2026-05-29 13:30:09.807338+05:30');
INSERT INTO public.django_migrations VALUES (25, 'dashboard', '0008_add_bank_account_to_cashbank', '2026-05-29 13:30:09.819087+05:30');
INSERT INTO public.django_migrations VALUES (26, 'dashboard', '0009_add_bank_account_to_sectionc', '2026-05-29 13:30:09.869104+05:30');
INSERT INTO public.django_migrations VALUES (27, 'dashboard', '0010_add_subsection_b2', '2026-05-29 13:30:09.900048+05:30');
INSERT INTO public.django_migrations VALUES (28, 'dashboard', '0011_subsectionb2tran_chq_date_subsectionb2tran_chq_no_and_more', '2026-05-29 13:30:09.918273+05:30');
INSERT INTO public.django_migrations VALUES (29, 'dashboard', '0012_subsection_b2_schema', '2026-05-29 13:30:09.949315+05:30');
INSERT INTO public.django_migrations VALUES (30, 'dashboard', '0013_subsection_b2_indexes', '2026-05-29 13:30:09.963357+05:30');
INSERT INTO public.django_migrations VALUES (31, 'dashboard', '0014_subsection_b2_udfs', '2026-05-29 13:30:10.016642+05:30');
INSERT INTO public.django_migrations VALUES (32, 'dashboard', '0015_subsection_b2_procedures', '2026-05-29 13:30:10.027745+05:30');
INSERT INTO public.django_migrations VALUES (33, 'dashboard', '0016_subsection_b2_triggers', '2026-05-29 13:30:10.037395+05:30');
INSERT INTO public.django_migrations VALUES (34, 'dashboard', '0017_alter_subsectionb2_options_and_more', '2026-05-29 13:30:10.054809+05:30');
INSERT INTO public.django_migrations VALUES (35, 'dashboard', '0018_cashbank_b2_fields', '2026-05-29 13:30:10.084191+05:30');
INSERT INTO public.django_migrations VALUES (36, 'dashboard', '0019_material_gateentry', '2026-05-29 13:30:10.12712+05:30');
INSERT INTO public.django_migrations VALUES (37, 'sessions', '0001_initial', '2026-05-29 13:30:10.144947+05:30');
INSERT INTO public.django_migrations VALUES (38, 'dashboard', '0020_alpha_cl_bal', '2026-06-03 18:47:32.962151+05:30');
INSERT INTO public.django_migrations VALUES (39, 'dashboard', '0021_sp_manage_transaction', '2026-06-05 17:43:33.902247+05:30');
INSERT INTO public.django_migrations VALUES (40, 'dashboard', '0022_remove_alpha_alpha_name_remove_alpha_code_and_more', '2026-06-06 15:02:40.745418+05:30');
INSERT INTO public.django_migrations VALUES (41, 'dashboard', '0023_fix_sp_manage_transaction', '2026-06-07 15:57:21.596865+05:30');
INSERT INTO public.django_migrations VALUES (42, 'dashboard', '0024_unify_cashbank_sp', '2026-06-07 16:14:57.922335+05:30');
INSERT INTO public.django_migrations VALUES (43, 'dashboard', '0025_rename_legacy_columns', '2026-06-07 17:30:33.847933+05:30');
INSERT INTO public.django_migrations VALUES (44, 'dashboard', '0025_alter_voucher_options_alter_voucherfact_options_and_more', '2026-06-09 10:43:33.161959+05:30');
INSERT INTO public.django_migrations VALUES (45, 'dashboard', '0026_purchase_order_sp', '2026-06-09 13:41:40.039631+05:30');
INSERT INTO public.django_migrations VALUES (46, 'dashboard', '0027_broker_vendorsupplier_alter_purchaseorder_broker_and_more', '2026-06-10 12:55:43.170193+05:30');
INSERT INTO public.django_migrations VALUES (47, 'dashboard', '0028_rename_alphagroup_to_accountmaster', '2026-06-10 13:51:16.25402+05:30');
INSERT INTO public.django_migrations VALUES (48, 'dashboard', '0029_sp_subsection_y', '2026-06-10 16:03:00.751424+05:30');
INSERT INTO public.django_migrations VALUES (49, 'dashboard', '0030_fix_section_a_sp', '2026-06-11 08:13:31.760834+05:30');
INSERT INTO public.django_migrations VALUES (51, 'dashboard', '0031_fix_delete_cascades', '2026-06-11 08:41:59.705569+05:30');
INSERT INTO public.django_migrations VALUES (52, 'dashboard', '0032_salpurgroup_salpurgrouptran_and_more', '2026-06-13 08:09:28.730818+05:30');
INSERT INTO public.django_migrations VALUES (53, 'dashboard', '0033_cashbank_gst_applicable_y_n', '2026-06-13 08:19:48.730707+05:30');
INSERT INTO public.django_migrations VALUES (54, 'dashboard', '0034_alter_salpurgroup_options_and_more', '2026-06-13 08:34:42.654826+05:30');
INSERT INTO public.django_migrations VALUES (55, 'dashboard', '0035_alter_salpurgroup_options_and_more', '2026-06-13 10:01:54.27456+05:30');
INSERT INTO public.django_migrations VALUES (56, 'dashboard', '0036_pursales_pursalestran_material_auto1_manual0_calc_and_more', '2026-06-14 10:03:23.698919+05:30');
INSERT INTO public.django_migrations VALUES (57, 'dashboard', '0037_zone', '2026-06-14 10:07:35.087397+05:30');
INSERT INTO public.django_migrations VALUES (58, 'dashboard', '0038_alter_broker_options_alter_pursales_options_and_more', '2026-06-18 11:40:10.314832+05:30');
INSERT INTO public.django_migrations VALUES (59, 'dashboard', '0039_alter_pursales_options_alter_pursalestran_options_and_more', '2026-06-18 16:23:31.174217+05:30');
INSERT INTO public.django_migrations VALUES (60, 'dashboard', '0040_alter_voucher_options_alter_voucherfact_options_and_more', '2026-06-18 16:24:38.413957+05:30');
INSERT INTO public.django_migrations VALUES (61, 'dashboard', '0041_update_purchase_order_sp', '2026-06-18 17:08:54.24013+05:30');
INSERT INTO public.django_migrations VALUES (62, 'dashboard', '0042_update_po_status_choices', '2026-06-19 09:09:19.760381+05:30');
INSERT INTO public.django_migrations VALUES (63, 'dashboard', '0043_allow_blank_delivery_fields', '2026-06-19 09:38:15.328201+05:30');
INSERT INTO public.django_migrations VALUES (64, 'dashboard', '0044_usermaster_alter_pursales_options_and_more', '2026-06-19 09:53:55.890353+05:30');


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public.django_session VALUES ('7abl5hrgry8otyv3i2toq6ss55uafb2o', 'eyJ1c2VyX2lkIjoiNzc0IiwidXNlcl9uYW1lIjoiSkhHRCIsInJvbGUiOiJDaGVja2VyIn0:1waTiL:oIrZ4Fs6W4dPql2ONeGw9ZOQ7jzRAoF0HscdFo70syY', '2026-07-03 13:02:33.775427+05:30');
INSERT INTO public.django_session VALUES ('gl8wlv2yd9ce79si86j6no8unngotl4k', 'eyJ1c2VyX2lkIjoibWFrZXIiLCJyb2xlIjoiTWFrZXIifQ:1waTmo:KBJH9EwyYtXhh4ns_fFIWfK8rkbfNPHF_SdoauNz8MI', '2026-07-03 13:07:10.087189+05:30');
INSERT INTO public.django_session VALUES ('kidiuav8zt6dldq56hgg37q9f92vb2bj', 'eyJ1c2VyX2lkIjoibWFrZXIiLCJyb2xlIjoiTWFrZXIifQ:1waTn0:vjP3-y7xTmIEJE9e-we2QUHt7X9kjNqoM_zDxGSquxY', '2026-07-03 13:07:22.053661+05:30');
INSERT INTO public.django_session VALUES ('atwjq5u9otxok73nx3owkntavus1hjsi', 'eyJ1c2VyX2lkIjoibWFrZXIiLCJyb2xlIjoiTWFrZXIifQ:1waToC:GCqPI4Z_J40BWACTz6e20p6o8QmghrXnZOkSwp4By8U', '2026-07-03 13:08:36.117566+05:30');
INSERT INTO public.django_session VALUES ('mmt8dmo3bsu00jytxbdju1207n4hcl6i', 'eyJ1c2VyX2lkIjoiNDM0IiwidXNlcl9uYW1lIjoiQkIiLCJyb2xlIjoiTWFrZXIifQ:1waTv6:68CnaSByMcxdhL6UTWtUAAZz_Q5W1MBqJAA3R9hdzw8', '2026-07-03 13:15:44.175627+05:30');
INSERT INTO public.django_session VALUES ('kk1lsp938yuudmu0pk7g7v0275zruul7', 'eyJ1c2VyX2lkIjoiNzc0IiwidXNlcl9uYW1lIjoiSkhHRCIsInJvbGUiOiJDaGVja2VyIn0:1waTwZ:Vc3g0pVX0YlNbjDsd2iSjmgYQ4MTmMP34q37t-Q29Q0', '2026-07-03 13:17:15.487445+05:30');
INSERT INTO public.django_session VALUES ('kbu62qi0gk2zr9d0uzbzly36z29nart0', 'eyJ1c2VyX2lkIjoiNDM0IiwidXNlcl9uYW1lIjoiQkIiLCJyb2xlIjoiTWFrZXIifQ:1waWQh:lT3UkWNvjhRF2c_IV08sZZdV9pF-yn3ZZfQ8kf2wD0s', '2026-07-03 15:56:31.5939+05:30');
INSERT INTO public.django_session VALUES ('sodck8fkl1o1jn09hhho8tsaiecwp331', 'eyJ1c2VyX2lkIjoiNzc0IiwidXNlcl9uYW1lIjoiSkhHRCIsInJvbGUiOiJDaGVja2VyIn0:1waXZp:urnuZGjt0puRXqGEKMhoTwa4HXYHPgjmm5Lyh3YXCV8', '2026-07-03 17:10:01.546456+05:30');


--
-- Data for Name: tblAccountmaster; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblAccountmaster" VALUES (43, 43, 'Seeded Alpha Group 26', 'Seeded Alpha 26', true, '2026-06-02 13:51:48.728207+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 4172.60);
INSERT INTO public."tblAccountmaster" VALUES (51, 51, 'Seeded Alpha Group 34', 'Seeded Alpha 34', true, '2026-06-02 13:51:48.752754+05:30', '2026-06-03 18:47:44.665053+05:30', 4, 5869.12);
INSERT INTO public."tblAccountmaster" VALUES (53, 53, 'Seeded Alpha Group 36', 'Seeded Alpha 36', true, '2026-06-02 13:51:48.752754+05:30', '2026-06-03 18:47:44.665053+05:30', 4, 7321.78);
INSERT INTO public."tblAccountmaster" VALUES (50, 50, 'Seeded Alpha Group 33', 'Seeded Alpha 33', true, '2026-06-02 13:51:48.752754+05:30', '2026-06-03 18:47:44.672328+05:30', 4, 14773.10);
INSERT INTO public."tblAccountmaster" VALUES (49, 49, 'Seeded Alpha Group 32', 'Seeded Alpha 32', true, '2026-06-02 13:51:48.750933+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 10260.77);
INSERT INTO public."tblAccountmaster" VALUES (47, 47, 'Seeded Alpha Group 30', 'Seeded Alpha 30', true, '2026-06-02 13:51:48.744398+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 3792.64);
INSERT INTO public."tblAccountmaster" VALUES (48, 48, 'Seeded Alpha Group 31', 'Seeded Alpha 31', true, '2026-06-02 13:51:48.744398+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 11805.55);
INSERT INTO public."tblAccountmaster" VALUES (46, 46, 'Seeded Alpha Group 29', 'Seeded Alpha 29', true, '2026-06-02 13:51:48.736389+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 12457.86);
INSERT INTO public."tblAccountmaster" VALUES (45, 45, 'Seeded Alpha Group 28', 'Seeded Alpha 28', true, '2026-06-02 13:51:48.736389+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 3056.97);
INSERT INTO public."tblAccountmaster" VALUES (42, 42, 'Seeded Alpha Group 25', 'Seeded Alpha 25', true, '2026-06-02 13:51:48.728207+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 9832.96);
INSERT INTO public."tblAccountmaster" VALUES (44, 44, 'Seeded Alpha Group 27', 'Seeded Alpha 27', true, '2026-06-02 13:51:48.728207+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 1390.37);
INSERT INTO public."tblAccountmaster" VALUES (39, 39, 'Seeded Alpha Group 22', 'Seeded Alpha 22', true, '2026-06-02 13:51:48.719763+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 6765.07);
INSERT INTO public."tblAccountmaster" VALUES (41, 41, 'Seeded Alpha Group 24', 'Seeded Alpha 24', true, '2026-06-02 13:51:48.719763+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 10866.11);
INSERT INTO public."tblAccountmaster" VALUES (40, 40, 'Seeded Alpha Group 23', 'Seeded Alpha 23', true, '2026-06-02 13:51:48.719763+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 5176.39);
INSERT INTO public."tblAccountmaster" VALUES (38, 38, 'Seeded Alpha Group 21', 'Seeded Alpha 21', true, '2026-06-02 13:51:48.719763+05:30', '2026-06-03 18:47:44.67335+05:30', 4, 12150.22);
INSERT INTO public."tblAccountmaster" VALUES (36, 36, 'Seeded Alpha Group 19', 'Seeded Alpha 19', true, '2026-06-02 13:51:48.711338+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 12447.98);
INSERT INTO public."tblAccountmaster" VALUES (37, 37, 'Seeded Alpha Group 20', 'Seeded Alpha 20', true, '2026-06-02 13:51:48.711338+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 3657.32);
INSERT INTO public."tblAccountmaster" VALUES (35, 35, 'Seeded Alpha Group 18', 'Seeded Alpha 18', true, '2026-06-02 13:51:48.711338+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 12485.12);
INSERT INTO public."tblAccountmaster" VALUES (33, 33, 'Seeded Alpha Group 16', 'Seeded Alpha 16', true, '2026-06-02 13:51:48.706295+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 12099.72);
INSERT INTO public."tblAccountmaster" VALUES (34, 34, 'Seeded Alpha Group 17', 'Seeded Alpha 17', true, '2026-06-02 13:51:48.706295+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 14612.58);
INSERT INTO public."tblAccountmaster" VALUES (32, 32, 'Seeded Alpha Group 15', 'Seeded Alpha 15', true, '2026-06-02 13:51:48.702681+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 2318.65);
INSERT INTO public."tblAccountmaster" VALUES (31, 31, 'Seeded Alpha Group 14', 'Seeded Alpha 14', true, '2026-06-02 13:51:48.701067+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 7129.94);
INSERT INTO public."tblAccountmaster" VALUES (30, 30, 'Seeded Alpha Group 13', 'Seeded Alpha 13', true, '2026-06-02 13:51:48.694581+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 10238.65);
INSERT INTO public."tblAccountmaster" VALUES (28, 28, 'Seeded Alpha Group 11', 'Seeded Alpha 11', true, '2026-06-02 13:51:48.694581+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 4496.09);
INSERT INTO public."tblAccountmaster" VALUES (29, 29, 'Seeded Alpha Group 12', 'Seeded Alpha 12', true, '2026-06-02 13:51:48.694581+05:30', '2026-06-03 18:47:44.682327+05:30', 4, 5158.00);
INSERT INTO public."tblAccountmaster" VALUES (25, 25, 'Seeded Alpha Group 8', 'Seeded Alpha 8', true, '2026-06-02 13:51:48.686049+05:30', '2026-06-03 18:47:44.690345+05:30', 4, 5943.61);
INSERT INTO public."tblAccountmaster" VALUES (27, 27, 'Seeded Alpha Group 10', 'Seeded Alpha 10', true, '2026-06-02 13:51:48.686049+05:30', '2026-06-03 18:47:44.690345+05:30', 4, 6385.49);
INSERT INTO public."tblAccountmaster" VALUES (26, 26, 'Seeded Alpha Group 9', 'Seeded Alpha 9', true, '2026-06-02 13:51:48.686049+05:30', '2026-06-03 18:47:44.690345+05:30', 4, 6086.62);
INSERT INTO public."tblAccountmaster" VALUES (24, 24, 'Seeded Alpha Group 7', 'Seeded Alpha 7', true, '2026-06-02 13:51:48.686049+05:30', '2026-06-03 18:47:44.69186+05:30', 4, 1748.78);
INSERT INTO public."tblAccountmaster" VALUES (23, 23, 'Seeded Alpha Group 6', 'Seeded Alpha 6', true, '2026-06-02 13:51:48.686049+05:30', '2026-06-03 18:47:44.693722+05:30', 4, 1273.13);
INSERT INTO public."tblAccountmaster" VALUES (21, 21, 'Seeded Alpha Group 4', 'Seeded Alpha 4', true, '2026-06-02 13:51:48.678236+05:30', '2026-06-03 18:47:44.693722+05:30', 4, 6284.11);
INSERT INTO public."tblAccountmaster" VALUES (22, 22, 'Seeded Alpha Group 5', 'Seeded Alpha 5', true, '2026-06-02 13:51:48.678236+05:30', '2026-06-03 18:47:44.693722+05:30', 4, 9473.11);
INSERT INTO public."tblAccountmaster" VALUES (19, 19, 'Seeded Alpha Group 2', 'Seeded Alpha 2', true, '2026-06-02 13:51:48.671034+05:30', '2026-06-03 18:47:44.693722+05:30', 4, 9331.93);
INSERT INTO public."tblAccountmaster" VALUES (20, 20, 'Seeded Alpha Group 3', 'Seeded Alpha 3', true, '2026-06-02 13:51:48.671034+05:30', '2026-06-03 18:47:44.693722+05:30', 4, 1633.92);
INSERT INTO public."tblAccountmaster" VALUES (18, 18, 'Seeded Alpha Group 1', 'Seeded Alpha 1', true, '2026-06-02 13:51:48.645249+05:30', '2026-06-03 18:47:44.693722+05:30', 4, 3676.64);
INSERT INTO public."tblAccountmaster" VALUES (17, 17, 'Seeded Expenses', 'Seeded Exp', true, '2026-06-02 13:45:25.212075+05:30', '2026-06-03 18:47:44.693722+05:30', 8, 10923.30);
INSERT INTO public."tblAccountmaster" VALUES (16, 16, 'Seeded HDFC Current Account', 'Seeded HDFC', true, '2026-06-02 13:45:25.203823+05:30', '2026-06-03 18:47:44.698816+05:30', 8, 6539.56);
INSERT INTO public."tblAccountmaster" VALUES (15, 15, 'sd', 'sd', true, '2026-06-02 13:33:08.103243+05:30', '2026-06-03 18:47:44.698816+05:30', 4, 6389.81);
INSERT INTO public."tblAccountmaster" VALUES (14, 14, 'zz', 'sds', true, '2026-06-02 13:32:56.422187+05:30', '2026-06-03 18:47:44.698816+05:30', 4, 508.63);
INSERT INTO public."tblAccountmaster" VALUES (13, 13, 'ds', 'ds', true, '2026-06-02 13:32:39.497348+05:30', '2026-06-03 18:47:44.698816+05:30', 4, 4884.93);
INSERT INTO public."tblAccountmaster" VALUES (12, 12, 'sd', 'ds', true, '2026-06-01 16:56:14.507026+05:30', '2026-06-03 18:47:44.698816+05:30', 7, 12192.46);
INSERT INTO public."tblAccountmaster" VALUES (11, 11, 'Validation Account 99', 'Validation Account 99', true, '2026-06-01 16:26:34.404694+05:30', '2026-06-03 18:47:44.698816+05:30', 4, 9025.27);
INSERT INTO public."tblAccountmaster" VALUES (10, 10, 'DFHG', 'HGHH', true, '2026-05-29 22:10:58.160796+05:30', '2026-06-03 18:47:44.702088+05:30', 5, 12553.66);
INSERT INTO public."tblAccountmaster" VALUES (9, 9, 'General', 'huhi', true, '2026-05-29 22:10:32.936604+05:30', '2026-06-03 18:47:44.702088+05:30', 4, 2288.42);
INSERT INTO public."tblAccountmaster" VALUES (8, 8, 'bvb', 'bbh', false, '2026-05-29 13:54:40.252074+05:30', '2026-06-03 18:47:44.702088+05:30', 4, 4961.93);
INSERT INTO public."tblAccountmaster" VALUES (54, 54, 'sddddddddddddddddd', 'dsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss', true, '2026-06-04 10:09:57.939695+05:30', '2026-06-04 10:09:57.939695+05:30', 4, 1222.00);
INSERT INTO public."tblAccountmaster" VALUES (55, 55, 'State Bank', 'State BBB', true, '2026-06-04 10:11:26.116451+05:30', '2026-06-04 10:11:26.116451+05:30', 5, 1244.00);
INSERT INTO public."tblAccountmaster" VALUES (58, 23, 'rd', 'weer', true, '2026-06-07 16:19:03.546061+05:30', '2026-06-07 16:19:03.546061+05:30', 5, 344.00);
INSERT INTO public."tblAccountmaster" VALUES (60, 9, 'hgf', 'fuj', true, '2026-06-09 10:14:39.367406+05:30', '2026-06-09 10:14:39.367406+05:30', 6, 766.00);
INSERT INTO public."tblAccountmaster" VALUES (57, 999990, 'Test Cash Account', 'Test Cash Account', true, '2026-06-07 15:56:52.902603+05:30', '2026-06-11 08:02:47.413503+05:30', 9, 0.00);
INSERT INTO public."tblAccountmaster" VALUES (61, 6555, 'hhghgk', 'mjhghfhf', true, '2026-06-13 12:42:06.233662+05:30', '2026-06-13 12:42:06.233662+05:30', 7, 0.00);
INSERT INTO public."tblAccountmaster" VALUES (62, 6555, 'hhghgk', 'mjhghfhf', true, '2026-06-13 12:42:21.716019+05:30', '2026-06-13 12:42:21.716019+05:30', 7, 0.00);
INSERT INTO public."tblAccountmaster" VALUES (63, 556, 'jhgj', 'bbhjj', true, '2026-06-13 12:58:48.236526+05:30', '2026-06-13 12:58:48.237304+05:30', 8, 0.00);
INSERT INTO public."tblAccountmaster" VALUES (64, 54, 'bgh', 'bvgh', true, '2026-06-13 13:00:08.394961+05:30', '2026-06-13 13:00:08.394961+05:30', 5, 0.00);
INSERT INTO public."tblAccountmaster" VALUES (65, 77, 'jvgk', 'vjj', true, '2026-06-13 13:16:56.10056+05:30', '2026-06-13 13:16:56.10056+05:30', 5, 0.00);
INSERT INTO public."tblAccountmaster" VALUES (66, 43, 'jgjh', 'hgjvb', true, '2026-06-13 13:23:07.985988+05:30', '2026-06-13 13:23:07.985988+05:30', 8, 0.00);


--
-- Data for Name: tblBroker; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblBroker" VALUES (0, 'Broker1', 'Broker1 Address', 'Broker1 Contact No', 'Broker1 PANo', 'usercreated', '2026-01-04 00:00:00+05:30', 'Usermodified', '2026-01-04 00:00:00+05:30');
INSERT INTO public."tblBroker" VALUES (2, 'Broker2', 'Broker2 Address', 'Broker2 Contact No', 'Broker2 PANo', 'usercreated', '2026-01-04 00:00:00+05:30', 'Usermodified', '2026-01-04 00:00:00+05:30');
INSERT INTO public."tblBroker" VALUES (3, 'Broker3', 'Broker3 Address', 'Broker3 Contact No', 'Broker3 PANo', 'usercreated', '2026-01-04 00:00:00+05:30', 'Usermodified', '2026-01-04 00:00:00+05:30');
INSERT INTO public."tblBroker" VALUES (4, 'hgy', NULL, NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: tblCASHBANK; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblCASHBANK" VALUES ('1', '2026-06-12 15:30:00+05:30', 'J001', 'I', 666.00, 'Test narrative', true, '', '2026-06-12 16:32:55.325343+05:30', '', '2026-06-12 16:32:55.325343+05:30', NULL, 'Y', NULL, NULL);
INSERT INTO public."tblCASHBANK" VALUES ('2', '2026-06-12 22:04:00+05:30', 'J001', 'I', 765.00, 'mn', true, '', '2026-06-12 16:34:25.650861+05:30', '', '2026-06-12 16:34:25.650861+05:30', 54, 'Y', NULL, NULL);
INSERT INTO public."tblCASHBANK" VALUES ('3', '2026-06-13 13:48:00+05:30', 'J001', 'I', 87.00, 'ghhjg', true, '', '2026-06-13 08:18:32.936785+05:30', '', '2026-06-13 08:18:32.936785+05:30', 57, 'Y', NULL, NULL);
INSERT INTO public."tblCASHBANK" VALUES ('8754', '2026-06-08 05:30:00+05:30', 'J000', NULL, 866.00, 'JHU', true, '', '2026-06-13 12:22:01.959593+05:30', '', '2026-06-13 12:22:01.959593+05:30', NULL, '', NULL, NULL);
INSERT INTO public."tblCASHBANK" VALUES ('6545', '2026-06-15 17:59:00+05:30', 'J001', 'I', 988.00, 'kjo', true, '', '2026-06-15 12:30:01.180805+05:30', '', '2026-06-15 12:30:01.180805+05:30', 63, '', NULL, NULL);


--
-- Data for Name: tblCASHBANK_TRAN; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblCASHBANK_TRAN" VALUES (135, '2026-06-12 15:30:00+05:30', 'J001', 'I', 666.00, 'test remarks', '', NULL, '', '', '2026-06-12 16:32:55.325343+05:30', '', '2026-06-12 16:32:55.325343+05:30', '1', NULL, '');
INSERT INTO public."tblCASHBANK_TRAN" VALUES (136, '2026-06-12 22:04:00+05:30', 'J001', 'I', 765.00, 'jvhj', 'auto', NULL, 'D', '', '2026-06-12 16:34:25.650861+05:30', '', '2026-06-12 16:34:25.650861+05:30', '2', 55, '');
INSERT INTO public."tblCASHBANK_TRAN" VALUES (137, '2026-06-13 13:48:00+05:30', 'J001', 'I', 87.00, 'hg', 'auto', NULL, 'D', '', '2026-06-13 08:18:32.936785+05:30', '', '2026-06-13 08:18:32.936785+05:30', '3', 58, '');
INSERT INTO public."tblCASHBANK_TRAN" VALUES (138, '2026-06-08 05:30:00+05:30', 'J000', 'A', 866.00, '', '', NULL, '', '', '2026-06-13 12:22:01.959593+05:30', '', '2026-06-13 12:22:01.959593+05:30', '8754', 58, '');
INSERT INTO public."tblCASHBANK_TRAN" VALUES (139, '2026-06-08 05:30:00+05:30', 'J000', 'B', 866.00, '', '', NULL, '', '', '2026-06-13 12:22:01.959593+05:30', '', '2026-06-13 12:22:01.959593+05:30', '8754', 54, '');
INSERT INTO public."tblCASHBANK_TRAN" VALUES (140, '2026-06-15 17:59:00+05:30', 'J001', 'I', 988.00, '', 'jij', '2026-06-10', '', '', '2026-06-15 12:30:01.180805+05:30', '', '2026-06-15 12:30:01.180805+05:30', '6545', 62, '');


--
-- Data for Name: tblCategory; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblCategory" VALUES (4, 'Bank Accounts', 'A');
INSERT INTO public."tblCategory" VALUES (5, 'Revenue Accounts', 'A');
INSERT INTO public."tblCategory" VALUES (6, 'Expense Accounts', 'A');
INSERT INTO public."tblCategory" VALUES (7, 'Asset Accounts', 'A');
INSERT INTO public."tblCategory" VALUES (8, 'Seeded Test Accounts', 'A');
INSERT INTO public."tblCategory" VALUES (9, 'Test Category', 'A');


--
-- Data for Name: tblGateEntry; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblGateEntry" VALUES (1, 'GP-10001', '2026-05-30 03:59:17+05:30', '355', 'gvh', 'data:image/jpeg;base64,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', '2026-05-29 22:31:07.652183+05:30', NULL, 8, 3);
INSERT INTO public."tblGateEntry" VALUES (2, 'GP-10002', '2026-05-30 04:02:40+05:30', '355', 'df', '', '2026-05-29 22:33:00.476592+05:30', NULL, 9, 3);
INSERT INTO public."tblGateEntry" VALUES (3, 'GP-10003', '2026-06-02 20:52:59+05:30', '090', 'gvh', 'data:image/jpeg;base64,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', '2026-06-02 15:24:02.412602+05:30', NULL, 9, 7);
INSERT INTO public."tblGateEntry" VALUES (4, 'GP-10004', '2026-06-09 18:24:20+05:30', '355', 'df', 'data:image/jpeg;base64,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', '2026-06-09 12:54:41.494148+05:30', NULL, 13, 3);
INSERT INTO public."tblGateEntry" VALUES (5, 'GP-10005', '2026-06-19 21:14:11+05:30', '65362', 'Chetan Chavan', 'data:image/jpeg;base64,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', '2026-06-19 15:44:53.406994+05:30', NULL, 62, 0);


--
-- Data for Name: tblMaterial; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblMaterial" VALUES (0, 'Material1', true, 0, 1, 1, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-000', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (1, 'Wheat', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-001', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (2, 'Rice', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-002', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (3, 'Grains', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-003', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (4, 'Sugar', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-004', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (5, 'Salt', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-005', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (6, 'Iron', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-006', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (7, 'Coal', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-007', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (8, 'SDD', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-109', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (9, 'SSSS', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-110', NULL, NULL, NULL);
INSERT INTO public."tblMaterial" VALUES (10, 'HVH', true, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M-111', NULL, NULL, NULL);


--
-- Data for Name: tblPurSales; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblPurSales" VALUES ('V-NEW-001', '2026-06-14', 'PUR', 'PO-NEW-001', '2026-06-14', 1, 66, NULL, NULL, 'Store-A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Fragile', 'X', '', '2026-06-14', '', '2026-06-14', 1, 0);
INSERT INTO public."tblPurSales" VALUES ('V-NEW-40022', '2026-06-14', 'PUR', 'PO-NEW-40022', '2026-06-14', 1, 66, NULL, NULL, 'Store-A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Fragile', 'X', '', '2026-06-14', '', '2026-06-14', 1, 0);
INSERT INTO public."tblPurSales" VALUES ('32112', '2026-06-14', 'PUR', '2123', '2026-06-14', 6, 10, 2, 0, 'f,snkj', 32667, 3222, 3442, NULL, 323, NULL, NULL, NULL, 'kjsdbj', 'm', '', '2026-06-14', '', '2026-06-14', 1, 0);


--
-- Data for Name: tblPurSales_Tran; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblPurSales_Tran" VALUES (1, 'V-NEW-001', '2026-06-14', 'PUR', 7, 10, 100.000, 10.000, 25.00, 2500.00, 18.00, 0.00, 225.00, 225.00, 2950.00, false, '', '2026-06-14 10:09:11.559326+05:30', '', '2026-06-14 10:09:11.559326+05:30');
INSERT INTO public."tblPurSales_Tran" VALUES (2, 'V-NEW-40022', '2026-06-14', 'PUR', 7, 10, 100.000, 10.000, 25.00, 2500.00, 18.00, 0.00, 225.00, 225.00, 2950.00, false, '', '2026-06-14 10:09:42.648438+05:30', '', '2026-06-14 10:09:42.648438+05:30');
INSERT INTO public."tblPurSales_Tran" VALUES (3, '32112', '2026-06-14', 'PUR', 6, 23, 7360.000, 320.000, 32.00, 235520.00, 0.00, 0.00, 0.00, 0.00, 235520.00, false, '', '2026-06-14 15:28:02.295374+05:30', '', '2026-06-14 15:28:02.295374+05:30');


--
-- Data for Name: tblPurchaseOrder; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblPurchaseOrder" VALUES ('PO-202606-0002', '2026-06-18 05:30:00+05:30', '2026-06-24', 'Submitted', 'East Region', '9887884', 'Tokyo, Japan', '763', 'Plant 1', 'FOB-FOT-FOR', '30 Days Credit', 'Supplier Paid', 'EUR', 'Mahesh Patil', 'Production', 'Plant A', 'Everything is ohk', 'No need any changes', 83384.00, 15009.12, 98393.12, true, '', '2026-06-09 13:22:27.125168+05:30', NULL, '2026-06-09 13:22:27.125168+05:30', 9, 60, NULL);
INSERT INTO public."tblPurchaseOrder" VALUES ('PO-202606-0004', '2026-06-18 05:30:00+05:30', '2026-06-30', 'Submitted', 'South Region', '73663', 'nkhkf', '636', 'Plant 2', 'Ex Works/Ex-Godown', 'Advance', 'Supplier Paid', 'INR', 'lkrf', 'Purchase', 'Plant A', 'kfdng', 'knjfk', 68324.00, 0.00, 68324.00, true, '', '2026-06-18 17:03:29.83424+05:30', '', '2026-06-18 17:03:29.83424+05:30', NULL, 2, NULL);
INSERT INTO public."tblPurchaseOrder" VALUES ('PO-202606-0005', '2026-06-19 05:30:00+05:30', NULL, 'Submitted', 'South Region', '', '', '', 'Plant 2', 'Ex Works/Ex-Godown', 'Advance', 'Supplier Paid', 'INR', 'kjh', 'Purchase', 'Plant A', 'hkl', 'mnbj', 5829.00, 0.00, 5829.00, true, '', '2026-06-19 09:39:44.27886+05:30', '', '2026-06-19 09:39:44.27886+05:30', 4, 2, 15);
INSERT INTO public."tblPurchaseOrder" VALUES ('PO-202606-0003', '2026-06-18 05:30:00+05:30', '2026-06-23', 'Submitted', 'West Region', 'wdds', 'sads', '8665', 'Plant 2', 'Ex Works/Ex-Godown', 'Advance', 'Supplier Paid', 'INR', '', 'Purchase', 'Plant A', '', '', 764712.00, 137648.16, 902360.16, false, '', '2026-06-18 11:45:59.976834+05:30', '', '2026-06-19 09:39:54.014861+05:30', 2, 3, NULL);
INSERT INTO public."tblPurchaseOrder" VALUES ('PO-202606-0006', '2026-06-19 05:30:00+05:30', '2026-06-10', 'Submitted', 'West Region', '', '', '', 'Plant 2', 'Ex Works/Ex-Godown', 'Advance', 'Supplier Paid', 'INR', 'hghj', 'Purchase', 'Plant A', 'mb', 'nbj', 5655.00, 0.00, 5655.00, true, '', '2026-06-19 09:41:08.074742+05:30', '', '2026-06-19 09:41:08.074742+05:30', 0, 4, 15);
INSERT INTO public."tblPurchaseOrder" VALUES ('PO-202606-0007', '2026-06-19 05:30:00+05:30', NULL, 'Approved', 'West Region', '', '', '', 'Plant 1', 'Ex Works/Ex-Godown', 'Advance', 'Supplier Paid', 'INR', 'jhgj', 'Purchase', 'Plant A', 'ghjjk', 'hjgjfc', 4940.00, 0.00, 4940.00, false, '', '2026-06-19 09:44:39.379809+05:30', '', '2026-06-19 09:45:14.765341+05:30', 0, 2, 5);
INSERT INTO public."tblPurchaseOrder" VALUES ('PO-202606-0008', '2026-06-19 05:30:00+05:30', '2026-06-10', 'Submitted', 'West Region', '', '', '', 'Plant 2', 'Ex Works/Ex-Godown', 'Advance', 'Supplier Paid', 'INR', 'lkrfdd', 'Purchase', 'Plant A', 'sa', 'dfsa', 1024.00, 0.00, 1024.00, true, '', '2026-06-19 17:10:58.953884+05:30', '', '2026-06-19 17:10:58.953884+05:30', 0, 4, 15);


--
-- Data for Name: tblPurchaseOrder_TRAN; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblPurchaseOrder_TRAN" VALUES (3, 54.0000, 'KG', 766.0000, 41364.00, 'good services', '', '2026-06-09 13:22:27.125168+05:30', NULL, '2026-06-09 13:22:27.125168+05:30', 3, 'PO-202606-0002');
INSERT INTO public."tblPurchaseOrder_TRAN" VALUES (4, 55.0000, 'MT', 764.0000, 42020.00, 'good services', '', '2026-06-09 13:22:27.13286+05:30', NULL, '2026-06-09 13:22:27.13286+05:30', 6, 'PO-202606-0002');
INSERT INTO public."tblPurchaseOrder_TRAN" VALUES (22, 2223.0000, 'KG', 344.0000, 764712.00, '', '', '2026-06-18 11:46:13.951836+05:30', '', '2026-06-18 11:46:13.951836+05:30', 4, 'PO-202606-0003');
INSERT INTO public."tblPurchaseOrder_TRAN" VALUES (23, 76.0000, 'MT', 899.0000, 68324.00, 'kjrh', '', '2026-06-18 17:03:29.83424+05:30', '', '2026-06-18 17:03:29.83424+05:30', 10, 'PO-202606-0004');
INSERT INTO public."tblPurchaseOrder_TRAN" VALUES (24, 87.0000, 'MT', 67.0000, 5829.00, '', '', '2026-06-19 09:39:44.27886+05:30', '', '2026-06-19 09:39:44.27886+05:30', 8, 'PO-202606-0005');
INSERT INTO public."tblPurchaseOrder_TRAN" VALUES (25, 65.0000, 'MT', 87.0000, 5655.00, '', '', '2026-06-19 09:41:08.074742+05:30', '', '2026-06-19 09:41:08.074742+05:30', 5, 'PO-202606-0006');
INSERT INTO public."tblPurchaseOrder_TRAN" VALUES (26, 65.0000, 'MT', 76.0000, 4940.00, '', '', '2026-06-19 09:44:39.379809+05:30', '', '2026-06-19 09:44:39.379809+05:30', 2, 'PO-202606-0007');
INSERT INTO public."tblPurchaseOrder_TRAN" VALUES (27, 32.0000, 'MT', 32.0000, 1024.00, '', '', '2026-06-19 17:10:58.953884+05:30', '', '2026-06-19 17:10:58.953884+05:30', 5, 'PO-202606-0008');


--
-- Data for Name: tblSalPurGroup; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblSalPurGroup" VALUES (2, 'test', false, NULL, NULL, '2026-06-13 10:32:22.039205+05:30', NULL, '2026-06-13 10:32:22.039205+05:30', NULL, NULL, NULL, NULL, true);
INSERT INTO public."tblSalPurGroup" VALUES (3, 'test', true, NULL, NULL, '2026-06-13 10:38:59.378353+05:30', NULL, '2026-06-13 10:38:59.378353+05:30', NULL, NULL, NULL, NULL, true);
INSERT INTO public."tblSalPurGroup" VALUES (5, 'hgjjmg,', true, 55, NULL, '2026-06-13 10:43:36.510913+05:30', NULL, '2026-06-13 10:43:36.510913+05:30', false, false, NULL, NULL, true);
INSERT INTO public."tblSalPurGroup" VALUES (6, 'hjgjj', true, 66, NULL, '2026-06-13 13:23:32.304066+05:30', NULL, '2026-06-16 09:08:30.439664+05:30', false, false, NULL, NULL, false);
INSERT INTO public."tblSalPurGroup" VALUES (1, 'test', false, NULL, NULL, '2026-06-13 10:32:14.86777+05:30', NULL, '2026-06-16 09:08:43.394409+05:30', NULL, NULL, NULL, NULL, false);
INSERT INTO public."tblSalPurGroup" VALUES (15, 'dsc', true, 65, NULL, '2026-06-16 12:18:47.751742+05:30', NULL, '2026-06-16 12:18:47.751742+05:30', true, false, false, NULL, true);


--
-- Data for Name: tblSalPurGroup_Tran; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblSalPurGroup_Tran" VALUES (2, 'fgjuh', 5, 51, true, 766.0000, 'D', NULL, '2026-06-13 10:43:36.534767+05:30', NULL, '2026-06-13 10:43:36.534767+05:30');
INSERT INTO public."tblSalPurGroup_Tran" VALUES (4, 'mjg', 6, 51, true, 877.0000, 'D', NULL, '2026-06-13 13:23:46.883564+05:30', NULL, '2026-06-13 13:23:46.883564+05:30');
INSERT INTO public."tblSalPurGroup_Tran" VALUES (7, 'fnf', 15, 65, true, 455.0000, 'D', NULL, '2026-06-16 12:18:47.751742+05:30', NULL, '2026-06-16 12:18:47.751742+05:30');


--
-- Data for Name: tblSectionC; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblSectionC" VALUES ('C-SEED-001', '2026-06-03 16:47:54.129203+05:30', 'CASH', 'P', 520.00, 'Seed Section C Transaction 1', true, NULL, '2026-06-03 16:47:54.129203+05:30', NULL, '2026-06-03 16:47:54.129203+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-002', '2026-06-03 16:47:54.14005+05:30', 'CASH', 'R', 540.00, 'Seed Section C Transaction 2', true, NULL, '2026-06-03 16:47:54.140364+05:30', NULL, '2026-06-03 16:47:54.140364+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-003', '2026-06-03 16:47:54.140364+05:30', 'CASH', 'P', 560.00, 'Seed Section C Transaction 3', true, NULL, '2026-06-03 16:47:54.140364+05:30', NULL, '2026-06-03 16:47:54.140364+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-004', '2026-06-03 16:47:54.144311+05:30', 'CASH', 'R', 580.00, 'Seed Section C Transaction 4', true, NULL, '2026-06-03 16:47:54.144311+05:30', NULL, '2026-06-03 16:47:54.144311+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-005', '2026-06-03 16:47:54.148399+05:30', 'CASH', 'P', 600.00, 'Seed Section C Transaction 5', true, NULL, '2026-06-03 16:47:54.148399+05:30', NULL, '2026-06-03 16:47:54.148399+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-006', '2026-06-03 16:47:54.151457+05:30', 'CASH', 'R', 620.00, 'Seed Section C Transaction 6', true, NULL, '2026-06-03 16:47:54.151457+05:30', NULL, '2026-06-03 16:47:54.151457+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-007', '2026-06-03 16:47:54.154277+05:30', 'CASH', 'P', 640.00, 'Seed Section C Transaction 7', true, NULL, '2026-06-03 16:47:54.154277+05:30', NULL, '2026-06-03 16:47:54.154277+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-008', '2026-06-03 16:47:54.154277+05:30', 'CASH', 'R', 660.00, 'Seed Section C Transaction 8', true, NULL, '2026-06-03 16:47:54.156844+05:30', NULL, '2026-06-03 16:47:54.156844+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-009', '2026-06-03 16:47:54.156844+05:30', 'CASH', 'P', 680.00, 'Seed Section C Transaction 9', true, NULL, '2026-06-03 16:47:54.156844+05:30', NULL, '2026-06-03 16:47:54.156844+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-010', '2026-06-03 16:47:54.156844+05:30', 'CASH', 'R', 700.00, 'Seed Section C Transaction 10', true, NULL, '2026-06-03 16:47:54.156844+05:30', NULL, '2026-06-03 16:47:54.156844+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-011', '2026-06-03 16:47:54.164672+05:30', 'CASH', 'P', 720.00, 'Seed Section C Transaction 11', true, NULL, '2026-06-03 16:47:54.164672+05:30', NULL, '2026-06-03 16:47:54.164672+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-012', '2026-06-03 16:47:54.164672+05:30', 'CASH', 'R', 740.00, 'Seed Section C Transaction 12', true, NULL, '2026-06-03 16:47:54.164672+05:30', NULL, '2026-06-03 16:47:54.164672+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-013', '2026-06-03 16:47:54.169767+05:30', 'CASH', 'P', 760.00, 'Seed Section C Transaction 13', true, NULL, '2026-06-03 16:47:54.169767+05:30', NULL, '2026-06-03 16:47:54.169767+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-014', '2026-06-03 16:47:54.169767+05:30', 'CASH', 'R', 780.00, 'Seed Section C Transaction 14', true, NULL, '2026-06-03 16:47:54.169767+05:30', NULL, '2026-06-03 16:47:54.169767+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-015', '2026-06-03 16:47:54.174248+05:30', 'CASH', 'P', 800.00, 'Seed Section C Transaction 15', true, NULL, '2026-06-03 16:47:54.174248+05:30', NULL, '2026-06-03 16:47:54.174248+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-016', '2026-06-03 16:47:54.177371+05:30', 'CASH', 'R', 820.00, 'Seed Section C Transaction 16', true, NULL, '2026-06-03 16:47:54.177371+05:30', NULL, '2026-06-03 16:47:54.177371+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-017', '2026-06-03 16:47:54.17942+05:30', 'CASH', 'P', 840.00, 'Seed Section C Transaction 17', true, NULL, '2026-06-03 16:47:54.17942+05:30', NULL, '2026-06-03 16:47:54.17942+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-018', '2026-06-03 16:47:54.181167+05:30', 'CASH', 'R', 860.00, 'Seed Section C Transaction 18', true, NULL, '2026-06-03 16:47:54.181167+05:30', NULL, '2026-06-03 16:47:54.181167+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-019', '2026-06-03 16:47:54.184302+05:30', 'CASH', 'P', 880.00, 'Seed Section C Transaction 19', true, NULL, '2026-06-03 16:47:54.184302+05:30', NULL, '2026-06-03 16:47:54.184302+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-020', '2026-06-03 16:47:54.184763+05:30', 'CASH', 'R', 900.00, 'Seed Section C Transaction 20', true, NULL, '2026-06-03 16:47:54.184763+05:30', NULL, '2026-06-03 16:47:54.184763+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-021', '2026-06-03 16:47:54.184763+05:30', 'CASH', 'P', 920.00, 'Seed Section C Transaction 21', true, NULL, '2026-06-03 16:47:54.184763+05:30', NULL, '2026-06-03 16:47:54.184763+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-022', '2026-06-03 16:47:54.18927+05:30', 'CASH', 'R', 940.00, 'Seed Section C Transaction 22', true, NULL, '2026-06-03 16:47:54.18927+05:30', NULL, '2026-06-03 16:47:54.18927+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-023', '2026-06-03 16:47:54.18927+05:30', 'CASH', 'P', 960.00, 'Seed Section C Transaction 23', true, NULL, '2026-06-03 16:47:54.18927+05:30', NULL, '2026-06-03 16:47:54.18927+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-024', '2026-06-03 16:47:54.18927+05:30', 'CASH', 'R', 980.00, 'Seed Section C Transaction 24', true, NULL, '2026-06-03 16:47:54.18927+05:30', NULL, '2026-06-03 16:47:54.18927+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-025', '2026-06-03 16:47:54.195702+05:30', 'CASH', 'P', 1000.00, 'Seed Section C Transaction 25', true, NULL, '2026-06-03 16:47:54.196009+05:30', NULL, '2026-06-03 16:47:54.196009+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-026', '2026-06-03 16:47:54.197752+05:30', 'CASH', 'R', 1020.00, 'Seed Section C Transaction 26', true, NULL, '2026-06-03 16:47:54.197752+05:30', NULL, '2026-06-03 16:47:54.197752+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-027', '2026-06-03 16:47:54.197752+05:30', 'CASH', 'P', 1040.00, 'Seed Section C Transaction 27', true, NULL, '2026-06-03 16:47:54.197752+05:30', NULL, '2026-06-03 16:47:54.197752+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-028', '2026-06-03 16:47:54.197752+05:30', 'CASH', 'R', 1060.00, 'Seed Section C Transaction 28', true, NULL, '2026-06-03 16:47:54.197752+05:30', NULL, '2026-06-03 16:47:54.197752+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-029', '2026-06-03 16:47:54.197752+05:30', 'CASH', 'P', 1080.00, 'Seed Section C Transaction 29', true, NULL, '2026-06-03 16:47:54.197752+05:30', NULL, '2026-06-03 16:47:54.197752+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-030', '2026-06-03 16:47:54.204306+05:30', 'CASH', 'R', 1100.00, 'Seed Section C Transaction 30', true, NULL, '2026-06-03 16:47:54.206056+05:30', NULL, '2026-06-03 16:47:54.206056+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-031', '2026-06-03 16:47:54.20649+05:30', 'CASH', 'P', 1120.00, 'Seed Section C Transaction 31', true, NULL, '2026-06-03 16:47:54.20649+05:30', NULL, '2026-06-03 16:47:54.20649+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-032', '2026-06-03 16:47:54.20649+05:30', 'CASH', 'R', 1140.00, 'Seed Section C Transaction 32', true, NULL, '2026-06-03 16:47:54.20649+05:30', NULL, '2026-06-03 16:47:54.20649+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-033', '2026-06-03 16:47:54.213856+05:30', 'CASH', 'P', 1160.00, 'Seed Section C Transaction 33', true, NULL, '2026-06-03 16:47:54.213856+05:30', NULL, '2026-06-03 16:47:54.213856+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-034', '2026-06-03 16:47:54.214382+05:30', 'CASH', 'R', 1180.00, 'Seed Section C Transaction 34', true, NULL, '2026-06-03 16:47:54.214382+05:30', NULL, '2026-06-03 16:47:54.214382+05:30', 50);
INSERT INTO public."tblSectionC" VALUES ('C-SEED-035', '2026-06-03 16:47:54.218142+05:30', 'CASH', 'P', 1200.00, 'Seed Section C Transaction 35', true, NULL, '2026-06-03 16:47:54.218142+05:30', NULL, '2026-06-03 16:47:54.218142+05:30', 50);


--
-- Data for Name: tblSectionC_TRAN; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblSectionC_TRAN" VALUES (1, '2026-06-03 16:47:54.132705+05:30', 'CASH', 'P', 520.00, 'Remarks for C-SEED-001', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.132705+05:30', NULL, '2026-06-03 16:47:54.132705+05:30', 50, 'C-SEED-001');
INSERT INTO public."tblSectionC_TRAN" VALUES (2, '2026-06-03 16:47:54.140364+05:30', 'CASH', 'R', 540.00, 'Remarks for C-SEED-002', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.140364+05:30', NULL, '2026-06-03 16:47:54.140364+05:30', 50, 'C-SEED-002');
INSERT INTO public."tblSectionC_TRAN" VALUES (3, '2026-06-03 16:47:54.144311+05:30', 'CASH', 'P', 560.00, 'Remarks for C-SEED-003', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.144311+05:30', NULL, '2026-06-03 16:47:54.144311+05:30', 50, 'C-SEED-003');
INSERT INTO public."tblSectionC_TRAN" VALUES (4, '2026-06-03 16:47:54.144311+05:30', 'CASH', 'R', 580.00, 'Remarks for C-SEED-004', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.144311+05:30', NULL, '2026-06-03 16:47:54.144311+05:30', 50, 'C-SEED-004');
INSERT INTO public."tblSectionC_TRAN" VALUES (5, '2026-06-03 16:47:54.148399+05:30', 'CASH', 'P', 600.00, 'Remarks for C-SEED-005', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.148399+05:30', NULL, '2026-06-03 16:47:54.148399+05:30', 50, 'C-SEED-005');
INSERT INTO public."tblSectionC_TRAN" VALUES (6, '2026-06-03 16:47:54.151457+05:30', 'CASH', 'R', 620.00, 'Remarks for C-SEED-006', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.151457+05:30', NULL, '2026-06-03 16:47:54.151457+05:30', 50, 'C-SEED-006');
INSERT INTO public."tblSectionC_TRAN" VALUES (7, '2026-06-03 16:47:54.154277+05:30', 'CASH', 'P', 640.00, 'Remarks for C-SEED-007', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.154277+05:30', NULL, '2026-06-03 16:47:54.154277+05:30', 50, 'C-SEED-007');
INSERT INTO public."tblSectionC_TRAN" VALUES (8, '2026-06-03 16:47:54.156844+05:30', 'CASH', 'R', 660.00, 'Remarks for C-SEED-008', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.156844+05:30', NULL, '2026-06-03 16:47:54.156844+05:30', 50, 'C-SEED-008');
INSERT INTO public."tblSectionC_TRAN" VALUES (9, '2026-06-03 16:47:54.156844+05:30', 'CASH', 'P', 680.00, 'Remarks for C-SEED-009', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.156844+05:30', NULL, '2026-06-03 16:47:54.156844+05:30', 50, 'C-SEED-009');
INSERT INTO public."tblSectionC_TRAN" VALUES (10, '2026-06-03 16:47:54.162231+05:30', 'CASH', 'R', 700.00, 'Remarks for C-SEED-010', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.162627+05:30', NULL, '2026-06-03 16:47:54.162627+05:30', 50, 'C-SEED-010');
INSERT INTO public."tblSectionC_TRAN" VALUES (11, '2026-06-03 16:47:54.164672+05:30', 'CASH', 'P', 720.00, 'Remarks for C-SEED-011', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.164672+05:30', NULL, '2026-06-03 16:47:54.164672+05:30', 50, 'C-SEED-011');
INSERT INTO public."tblSectionC_TRAN" VALUES (12, '2026-06-03 16:47:54.164672+05:30', 'CASH', 'R', 740.00, 'Remarks for C-SEED-012', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.164672+05:30', NULL, '2026-06-03 16:47:54.164672+05:30', 50, 'C-SEED-012');
INSERT INTO public."tblSectionC_TRAN" VALUES (13, '2026-06-03 16:47:54.169767+05:30', 'CASH', 'P', 760.00, 'Remarks for C-SEED-013', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.169767+05:30', NULL, '2026-06-03 16:47:54.169767+05:30', 50, 'C-SEED-013');
INSERT INTO public."tblSectionC_TRAN" VALUES (14, '2026-06-03 16:47:54.17281+05:30', 'CASH', 'R', 780.00, 'Remarks for C-SEED-014', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.17281+05:30', NULL, '2026-06-03 16:47:54.17281+05:30', 50, 'C-SEED-014');
INSERT INTO public."tblSectionC_TRAN" VALUES (15, '2026-06-03 16:47:54.174248+05:30', 'CASH', 'P', 800.00, 'Remarks for C-SEED-015', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.174248+05:30', NULL, '2026-06-03 16:47:54.174248+05:30', 50, 'C-SEED-015');
INSERT INTO public."tblSectionC_TRAN" VALUES (16, '2026-06-03 16:47:54.177371+05:30', 'CASH', 'R', 820.00, 'Remarks for C-SEED-016', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.177371+05:30', NULL, '2026-06-03 16:47:54.177371+05:30', 50, 'C-SEED-016');
INSERT INTO public."tblSectionC_TRAN" VALUES (17, '2026-06-03 16:47:54.17942+05:30', 'CASH', 'P', 840.00, 'Remarks for C-SEED-017', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.181167+05:30', NULL, '2026-06-03 16:47:54.181167+05:30', 50, 'C-SEED-017');
INSERT INTO public."tblSectionC_TRAN" VALUES (18, '2026-06-03 16:47:54.181167+05:30', 'CASH', 'R', 860.00, 'Remarks for C-SEED-018', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.181167+05:30', NULL, '2026-06-03 16:47:54.181167+05:30', 50, 'C-SEED-018');
INSERT INTO public."tblSectionC_TRAN" VALUES (19, '2026-06-03 16:47:54.184763+05:30', 'CASH', 'P', 880.00, 'Remarks for C-SEED-019', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.184763+05:30', NULL, '2026-06-03 16:47:54.184763+05:30', 50, 'C-SEED-019');
INSERT INTO public."tblSectionC_TRAN" VALUES (20, '2026-06-03 16:47:54.184763+05:30', 'CASH', 'R', 900.00, 'Remarks for C-SEED-020', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.184763+05:30', NULL, '2026-06-03 16:47:54.184763+05:30', 50, 'C-SEED-020');
INSERT INTO public."tblSectionC_TRAN" VALUES (21, '2026-06-03 16:47:54.18927+05:30', 'CASH', 'P', 920.00, 'Remarks for C-SEED-021', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.18927+05:30', NULL, '2026-06-03 16:47:54.18927+05:30', 50, 'C-SEED-021');
INSERT INTO public."tblSectionC_TRAN" VALUES (22, '2026-06-03 16:47:54.18927+05:30', 'CASH', 'R', 940.00, 'Remarks for C-SEED-022', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.18927+05:30', NULL, '2026-06-03 16:47:54.18927+05:30', 50, 'C-SEED-022');
INSERT INTO public."tblSectionC_TRAN" VALUES (23, '2026-06-03 16:47:54.18927+05:30', 'CASH', 'P', 960.00, 'Remarks for C-SEED-023', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.18927+05:30', NULL, '2026-06-03 16:47:54.18927+05:30', 50, 'C-SEED-023');
INSERT INTO public."tblSectionC_TRAN" VALUES (24, '2026-06-03 16:47:54.18927+05:30', 'CASH', 'R', 980.00, 'Remarks for C-SEED-024', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.18927+05:30', NULL, '2026-06-03 16:47:54.18927+05:30', 50, 'C-SEED-024');
INSERT INTO public."tblSectionC_TRAN" VALUES (25, '2026-06-03 16:47:54.196009+05:30', 'CASH', 'P', 1000.00, 'Remarks for C-SEED-025', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.196009+05:30', NULL, '2026-06-03 16:47:54.196009+05:30', 50, 'C-SEED-025');
INSERT INTO public."tblSectionC_TRAN" VALUES (26, '2026-06-03 16:47:54.197752+05:30', 'CASH', 'R', 1020.00, 'Remarks for C-SEED-026', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.197752+05:30', NULL, '2026-06-03 16:47:54.197752+05:30', 50, 'C-SEED-026');
INSERT INTO public."tblSectionC_TRAN" VALUES (27, '2026-06-03 16:47:54.197752+05:30', 'CASH', 'P', 1040.00, 'Remarks for C-SEED-027', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.197752+05:30', NULL, '2026-06-03 16:47:54.197752+05:30', 50, 'C-SEED-027');
INSERT INTO public."tblSectionC_TRAN" VALUES (28, '2026-06-03 16:47:54.197752+05:30', 'CASH', 'R', 1060.00, 'Remarks for C-SEED-028', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.197752+05:30', NULL, '2026-06-03 16:47:54.197752+05:30', 50, 'C-SEED-028');
INSERT INTO public."tblSectionC_TRAN" VALUES (29, '2026-06-03 16:47:54.204306+05:30', 'CASH', 'P', 1080.00, 'Remarks for C-SEED-029', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.204306+05:30', NULL, '2026-06-03 16:47:54.204306+05:30', 50, 'C-SEED-029');
INSERT INTO public."tblSectionC_TRAN" VALUES (30, '2026-06-03 16:47:54.20649+05:30', 'CASH', 'R', 1100.00, 'Remarks for C-SEED-030', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.20649+05:30', NULL, '2026-06-03 16:47:54.20649+05:30', 50, 'C-SEED-030');
INSERT INTO public."tblSectionC_TRAN" VALUES (31, '2026-06-03 16:47:54.20649+05:30', 'CASH', 'P', 1120.00, 'Remarks for C-SEED-031', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.20649+05:30', NULL, '2026-06-03 16:47:54.20649+05:30', 50, 'C-SEED-031');
INSERT INTO public."tblSectionC_TRAN" VALUES (32, '2026-06-03 16:47:54.20649+05:30', 'CASH', 'R', 1140.00, 'Remarks for C-SEED-032', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.20649+05:30', NULL, '2026-06-03 16:47:54.20649+05:30', 50, 'C-SEED-032');
INSERT INTO public."tblSectionC_TRAN" VALUES (33, '2026-06-03 16:47:54.214382+05:30', 'CASH', 'P', 1160.00, 'Remarks for C-SEED-033', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.214382+05:30', NULL, '2026-06-03 16:47:54.214382+05:30', 50, 'C-SEED-033');
INSERT INTO public."tblSectionC_TRAN" VALUES (34, '2026-06-03 16:47:54.214382+05:30', 'CASH', 'R', 1180.00, 'Remarks for C-SEED-034', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.214382+05:30', NULL, '2026-06-03 16:47:54.214382+05:30', 50, 'C-SEED-034');
INSERT INTO public."tblSectionC_TRAN" VALUES (35, '2026-06-03 16:47:54.218142+05:30', 'CASH', 'P', 1200.00, 'Remarks for C-SEED-035', NULL, NULL, NULL, NULL, '2026-06-03 16:47:54.218142+05:30', NULL, '2026-06-03 16:47:54.218142+05:30', 50, 'C-SEED-035');


--
-- Data for Name: tblSubsectionB2; Type: TABLE DATA; Schema: public; Owner: alpha_user
--



--
-- Data for Name: tblSubsectionB2_TRAN; Type: TABLE DATA; Schema: public; Owner: alpha_user
--



--
-- Data for Name: tblUserMaster; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblUserMaster" VALUES ('434', 'BB', 'Maker', '876', true, NULL, '2026-06-19 10:51:39.795856+05:30', NULL, '2026-06-19 10:51:39.795856+05:30');
INSERT INTO public."tblUserMaster" VALUES ('774', 'JHGD', 'Checker', '874', true, NULL, '2026-06-19 11:21:31.105455+05:30', NULL, '2026-06-19 11:21:31.105455+05:30');


--
-- Data for Name: tblVendorSupplier; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblVendorSupplier" VALUES (0, 'supplier1', 'address', NULL, NULL, 'GST', 'PAN1', NULL, NULL, NULL, NULL);
INSERT INTO public."tblVendorSupplier" VALUES (2, 'supplier2', 'address', NULL, NULL, 'GST', 'PAN1', NULL, NULL, NULL, NULL);
INSERT INTO public."tblVendorSupplier" VALUES (3, 'supplier3', 'address', NULL, NULL, 'GST', 'PAN1', NULL, NULL, NULL, NULL);
INSERT INTO public."tblVendorSupplier" VALUES (4, 'supplier4', 'address', NULL, NULL, 'GST', 'PAN1', NULL, NULL, NULL, NULL);
INSERT INTO public."tblVendorSupplier" VALUES (5, 'Vendor', 'address', NULL, NULL, 'GST', 'PAN4', NULL, NULL, NULL, NULL);
INSERT INTO public."tblVendorSupplier" VALUES (6, 'Vendor2', 'address', NULL, NULL, 'GST', 'PAN4', NULL, NULL, NULL, NULL);
INSERT INTO public."tblVendorSupplier" VALUES (7, 'Vendor3', 'address', NULL, NULL, 'GST', 'PAN4', NULL, NULL, NULL, NULL);


--
-- Data for Name: tblZone; Type: TABLE DATA; Schema: public; Owner: alpha_user
--

INSERT INTO public."tblZone" VALUES (0, 'East', NULL, NULL, NULL, NULL);
INSERT INTO public."tblZone" VALUES (1, 'West', NULL, NULL, NULL, NULL);
INSERT INTO public."tblZone" VALUES (2, 'Central', NULL, NULL, NULL, NULL);


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 116, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 1, true);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: dashboard_voucher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.dashboard_voucher_id_seq', 41, true);


--
-- Name: dashboard_voucherfact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.dashboard_voucherfact_id_seq', 82, true);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 28, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 64, true);


--
-- Name: tblAlphagroup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblAlphagroup_id_seq"', 66, true);


--
-- Name: tblCASHBANK_TRAN_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblCASHBANK_TRAN_id_seq"', 140, true);


--
-- Name: tblCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblCategory_id_seq"', 9, true);


--
-- Name: tblGateEntry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblGateEntry_id_seq"', 5, true);


--
-- Name: tblMaterial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblMaterial_id_seq"', 10, true);


--
-- Name: tblPurSales_Tran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblPurSales_Tran_id_seq"', 10, true);


--
-- Name: tblPurchaseOrder_TRAN_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblPurchaseOrder_TRAN_id_seq"', 27, true);


--
-- Name: tblSalPurGroup_SalPurGroupID_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblSalPurGroup_SalPurGroupID_seq"', 16, false);


--
-- Name: tblSalPurGroup_Tran_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblSalPurGroup_Tran_ID_seq"', 8, false);


--
-- Name: tblSectionC_TRAN_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblSectionC_TRAN_id_seq"', 36, true);


--
-- Name: tblSubsectionB2_TRAN_id_seq; Type: SEQUENCE SET; Schema: public; Owner: alpha_user
--

SELECT pg_catalog.setval('public."tblSubsectionB2_TRAN_id_seq"', 1, false);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: dashboard_voucher dashboard_voucher_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.dashboard_voucher
    ADD CONSTRAINT dashboard_voucher_pkey PRIMARY KEY (id);


--
-- Name: dashboard_voucher dashboard_voucher_voucher_number_key; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.dashboard_voucher
    ADD CONSTRAINT dashboard_voucher_voucher_number_key UNIQUE (voucher_number);


--
-- Name: dashboard_voucherfact dashboard_voucherfact_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.dashboard_voucherfact
    ADD CONSTRAINT dashboard_voucherfact_pkey PRIMARY KEY (id);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: tblAccountmaster tblAlphagroup_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblAccountmaster"
    ADD CONSTRAINT "tblAlphagroup_pkey" PRIMARY KEY (id);


--
-- Name: tblCASHBANK_TRAN tblCASHBANK_TRAN_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblCASHBANK_TRAN"
    ADD CONSTRAINT "tblCASHBANK_TRAN_pkey" PRIMARY KEY (id);


--
-- Name: tblCASHBANK tblCASHBANK_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblCASHBANK"
    ADD CONSTRAINT "tblCASHBANK_pkey" PRIMARY KEY (voucher_no);


--
-- Name: tblCategory tblCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblCategory"
    ADD CONSTRAINT "tblCategory_pkey" PRIMARY KEY (id);


--
-- Name: tblGateEntry tblGateEntry_gate_pass_id_key; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblGateEntry"
    ADD CONSTRAINT "tblGateEntry_gate_pass_id_key" UNIQUE (gate_pass_id);


--
-- Name: tblGateEntry tblGateEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblGateEntry"
    ADD CONSTRAINT "tblGateEntry_pkey" PRIMARY KEY (id);


--
-- Name: tblMaterial tblMaterial_material_code_key; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblMaterial"
    ADD CONSTRAINT "tblMaterial_material_code_key" UNIQUE (material_code);


--
-- Name: tblMaterial tblMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblMaterial"
    ADD CONSTRAINT "tblMaterial_pkey" PRIMARY KEY (id);


--
-- Name: tblPurSales_Tran tblPurSales_Tran_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblPurSales_Tran"
    ADD CONSTRAINT "tblPurSales_Tran_pkey" PRIMARY KEY (id);


--
-- Name: tblPurSales tblPurSales_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblPurSales"
    ADD CONSTRAINT "tblPurSales_pkey" PRIMARY KEY ("OrderNo");


--
-- Name: tblPurchaseOrder_TRAN tblPurchaseOrder_TRAN_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblPurchaseOrder_TRAN"
    ADD CONSTRAINT "tblPurchaseOrder_TRAN_pkey" PRIMARY KEY (id);


--
-- Name: tblPurchaseOrder tblPurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblPurchaseOrder"
    ADD CONSTRAINT "tblPurchaseOrder_pkey" PRIMARY KEY (po_no);


--
-- Name: tblSalPurGroup_Tran tblSalPurGroup_Tran_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSalPurGroup_Tran"
    ADD CONSTRAINT "tblSalPurGroup_Tran_pkey" PRIMARY KEY ("ID");


--
-- Name: tblSalPurGroup tblSalPurGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSalPurGroup"
    ADD CONSTRAINT "tblSalPurGroup_pkey" PRIMARY KEY ("SalPurGroupID");


--
-- Name: tblSectionC_TRAN tblSectionC_TRAN_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSectionC_TRAN"
    ADD CONSTRAINT "tblSectionC_TRAN_pkey" PRIMARY KEY (id);


--
-- Name: tblSectionC tblSectionC_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSectionC"
    ADD CONSTRAINT "tblSectionC_pkey" PRIMARY KEY (voucher_no);


--
-- Name: tblSubsectionB2_TRAN tblSubsectionB2_TRAN_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSubsectionB2_TRAN"
    ADD CONSTRAINT "tblSubsectionB2_TRAN_pkey" PRIMARY KEY (id);


--
-- Name: tblSubsectionB2 tblSubsectionB2_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSubsectionB2"
    ADD CONSTRAINT "tblSubsectionB2_pkey" PRIMARY KEY (voucher_no);


--
-- Name: tblUserMaster tblUserMaster_empid_key; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblUserMaster"
    ADD CONSTRAINT "tblUserMaster_empid_key" UNIQUE (empid);


--
-- Name: tblUserMaster tblUserMaster_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblUserMaster"
    ADD CONSTRAINT "tblUserMaster_pkey" PRIMARY KEY (user_id);


--
-- Name: tblVendorSupplier tblVendorSupplier_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblVendorSupplier"
    ADD CONSTRAINT "tblVendorSupplier_pkey" PRIMARY KEY ("VendorSupplierID");


--
-- Name: tblZone tblZone_pkey; Type: CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblZone"
    ADD CONSTRAINT "tblZone_pkey" PRIMARY KEY ("ZoneID");


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: dashboard_voucher_voucher_number_300b02ea_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX dashboard_voucher_voucher_number_300b02ea_like ON public.dashboard_voucher USING btree (voucher_number varchar_pattern_ops);


--
-- Name: dashboard_voucherfact_alpha_group_id_d1ae66c5; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX dashboard_voucherfact_alpha_group_id_d1ae66c5 ON public.dashboard_voucherfact USING btree (accountmaster_id);


--
-- Name: dashboard_voucherfact_voucher_id_e280e456; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX dashboard_voucherfact_voucher_id_e280e456 ON public.dashboard_voucherfact USING btree (voucher_id);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: idx_b2_chq_no_partial; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX idx_b2_chq_no_partial ON public."tblSubsectionB2_TRAN" USING btree (chq_no) WHERE (chq_no IS NOT NULL);


--
-- Name: idx_b2_cost_center_partial; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX idx_b2_cost_center_partial ON public."tblSubsectionB2_TRAN" USING btree (cost_center) WHERE (cost_center IS NOT NULL);


--
-- Name: idx_b2_reporting_composite; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX idx_b2_reporting_composite ON public."tblSubsectionB2" USING btree (transaction_date, posting_status);


--
-- Name: idx_b2_tran_reporting; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX idx_b2_tran_reporting ON public."tblSubsectionB2_TRAN" USING btree (transaction_date, accountmaster_id);


--
-- Name: idx_b2_tran_voucherno; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX idx_b2_tran_voucherno ON public."tblSubsectionB2_TRAN" USING btree ("VoucherNo");


--
-- Name: tblAlphagroup_categoryID_55217ceb; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblAlphagroup_categoryID_55217ceb" ON public."tblAccountmaster" USING btree ("categoryID");


--
-- Name: tblCASHBANK_BankAccount_0d90bc6d; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblCASHBANK_BankAccount_0d90bc6d" ON public."tblCASHBANK" USING btree ("BankAccount");


--
-- Name: tblCASHBANK_TRAN_VoucherNo_7383c4d9; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblCASHBANK_TRAN_VoucherNo_7383c4d9" ON public."tblCASHBANK_TRAN" USING btree ("VoucherNo");


--
-- Name: tblCASHBANK_TRAN_VoucherNo_7383c4d9_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblCASHBANK_TRAN_VoucherNo_7383c4d9_like" ON public."tblCASHBANK_TRAN" USING btree ("VoucherNo" varchar_pattern_ops);


--
-- Name: tblCASHBANK_TRAN_alpha_group_id_e026af4a; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblCASHBANK_TRAN_alpha_group_id_e026af4a" ON public."tblCASHBANK_TRAN" USING btree (accountmaster_id);


--
-- Name: tblCASHBANK_module_type_3b97e142; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblCASHBANK_module_type_3b97e142" ON public."tblCASHBANK" USING btree (module_type);


--
-- Name: tblCASHBANK_module_type_3b97e142_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblCASHBANK_module_type_3b97e142_like" ON public."tblCASHBANK" USING btree (module_type varchar_pattern_ops);


--
-- Name: tblCASHBANK_voucher_no_7a22c4b3_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblCASHBANK_voucher_no_7a22c4b3_like" ON public."tblCASHBANK" USING btree (voucher_no varchar_pattern_ops);


--
-- Name: tblGateEntry_created_by_id_3e403935; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblGateEntry_created_by_id_3e403935" ON public."tblGateEntry" USING btree (created_by_id);


--
-- Name: tblGateEntry_gate_pass_id_fdf3eb6b_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblGateEntry_gate_pass_id_fdf3eb6b_like" ON public."tblGateEntry" USING btree (gate_pass_id varchar_pattern_ops);


--
-- Name: tblGateEntry_material_type_id_ea157c65; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblGateEntry_material_type_id_ea157c65" ON public."tblGateEntry" USING btree (material_type_id);


--
-- Name: tblGateEntry_supplier_id_c0aed273; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblGateEntry_supplier_id_c0aed273" ON public."tblGateEntry" USING btree (supplier_id);


--
-- Name: tblPurchaseOrder_SalPurGroupID_10151954; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblPurchaseOrder_SalPurGroupID_10151954" ON public."tblPurchaseOrder" USING btree ("SalPurGroupID");


--
-- Name: tblPurchaseOrder_TRAN_PONo_befb3715; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblPurchaseOrder_TRAN_PONo_befb3715" ON public."tblPurchaseOrder_TRAN" USING btree ("PONo");


--
-- Name: tblPurchaseOrder_TRAN_PONo_befb3715_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblPurchaseOrder_TRAN_PONo_befb3715_like" ON public."tblPurchaseOrder_TRAN" USING btree ("PONo" varchar_pattern_ops);


--
-- Name: tblPurchaseOrder_TRAN_item_id_15398968; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblPurchaseOrder_TRAN_item_id_15398968" ON public."tblPurchaseOrder_TRAN" USING btree (item_id);


--
-- Name: tblPurchaseOrder_broker_id_afdaf2ce; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblPurchaseOrder_broker_id_afdaf2ce" ON public."tblPurchaseOrder" USING btree (broker_id);


--
-- Name: tblPurchaseOrder_po_no_8c945f8c_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblPurchaseOrder_po_no_8c945f8c_like" ON public."tblPurchaseOrder" USING btree (po_no varchar_pattern_ops);


--
-- Name: tblPurchaseOrder_supplier_id_0312ed54; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblPurchaseOrder_supplier_id_0312ed54" ON public."tblPurchaseOrder" USING btree (supplier_id);


--
-- Name: tblSalPurGroup_GroupwiseAccountID_be613f5b; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSalPurGroup_GroupwiseAccountID_be613f5b" ON public."tblSalPurGroup" USING btree ("GroupwiseAccountID");


--
-- Name: tblSalPurGroup_Tran_ChargeAccountID_009807f3; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSalPurGroup_Tran_ChargeAccountID_009807f3" ON public."tblSalPurGroup_Tran" USING btree ("ChargeAccountID");


--
-- Name: tblSalPurGroup_Tran_SalPurGroupID_b11a8d7e; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSalPurGroup_Tran_SalPurGroupID_b11a8d7e" ON public."tblSalPurGroup_Tran" USING btree ("SalPurGroupID");


--
-- Name: tblSectionC_BankAccount_246fc912; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSectionC_BankAccount_246fc912" ON public."tblSectionC" USING btree ("BankAccount");


--
-- Name: tblSectionC_TRAN_VoucherNo_dad46454; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSectionC_TRAN_VoucherNo_dad46454" ON public."tblSectionC_TRAN" USING btree ("VoucherNo");


--
-- Name: tblSectionC_TRAN_VoucherNo_dad46454_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSectionC_TRAN_VoucherNo_dad46454_like" ON public."tblSectionC_TRAN" USING btree ("VoucherNo" varchar_pattern_ops);


--
-- Name: tblSectionC_TRAN_alpha_group_id_288509e3; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSectionC_TRAN_alpha_group_id_288509e3" ON public."tblSectionC_TRAN" USING btree (accountmaster_id);


--
-- Name: tblSectionC_voucher_no_42931d10_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSectionC_voucher_no_42931d10_like" ON public."tblSectionC" USING btree (voucher_no varchar_pattern_ops);


--
-- Name: tblSubsectionB2_BankAccount_ba779399; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSubsectionB2_BankAccount_ba779399" ON public."tblSubsectionB2" USING btree ("BankAccount");


--
-- Name: tblSubsectionB2_TRAN_VoucherNo_19ef3ff2; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSubsectionB2_TRAN_VoucherNo_19ef3ff2" ON public."tblSubsectionB2_TRAN" USING btree ("VoucherNo");


--
-- Name: tblSubsectionB2_TRAN_VoucherNo_19ef3ff2_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSubsectionB2_TRAN_VoucherNo_19ef3ff2_like" ON public."tblSubsectionB2_TRAN" USING btree ("VoucherNo" varchar_pattern_ops);


--
-- Name: tblSubsectionB2_TRAN_alpha_group_id_fcd832e7; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSubsectionB2_TRAN_alpha_group_id_fcd832e7" ON public."tblSubsectionB2_TRAN" USING btree (accountmaster_id);


--
-- Name: tblSubsectionB2_voucher_no_5ca41d3e_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblSubsectionB2_voucher_no_5ca41d3e_like" ON public."tblSubsectionB2" USING btree (voucher_no varchar_pattern_ops);


--
-- Name: tblUserMaster_empid_a77ccf58_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblUserMaster_empid_a77ccf58_like" ON public."tblUserMaster" USING btree (empid varchar_pattern_ops);


--
-- Name: tblUserMaster_user_id_a7f49b2d_like; Type: INDEX; Schema: public; Owner: alpha_user
--

CREATE INDEX "tblUserMaster_user_id_a7f49b2d_like" ON public."tblUserMaster" USING btree (user_id varchar_pattern_ops);


--
-- Name: tblSubsectionB2_TRAN trg_verify_b2_detail_lock; Type: TRIGGER; Schema: public; Owner: alpha_user
--

CREATE TRIGGER trg_verify_b2_detail_lock BEFORE INSERT OR DELETE OR UPDATE ON public."tblSubsectionB2_TRAN" FOR EACH ROW EXECUTE FUNCTION public.fn_verify_b2_lock();


--
-- Name: tblSubsectionB2 trg_verify_b2_header_lock; Type: TRIGGER; Schema: public; Owner: alpha_user
--

CREATE TRIGGER trg_verify_b2_header_lock BEFORE DELETE OR UPDATE ON public."tblSubsectionB2" FOR EACH ROW EXECUTE FUNCTION public.fn_verify_b2_lock();


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: dashboard_voucherfact dashboard_voucherfact_alpha_group_id_d1ae66c5_fk; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.dashboard_voucherfact
    ADD CONSTRAINT dashboard_voucherfact_alpha_group_id_d1ae66c5_fk FOREIGN KEY (accountmaster_id) REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: dashboard_voucherfact dashboard_voucherfact_voucher_id_e280e456_fk; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.dashboard_voucherfact
    ADD CONSTRAINT dashboard_voucherfact_voucher_id_e280e456_fk FOREIGN KEY (voucher_id) REFERENCES public.dashboard_voucher(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblAccountmaster tblAlphagroup_categoryID_55217ceb_fk; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblAccountmaster"
    ADD CONSTRAINT "tblAlphagroup_categoryID_55217ceb_fk" FOREIGN KEY ("categoryID") REFERENCES public."tblCategory"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblCASHBANK tblCASHBANK_BankAccount_0d90bc6d_fk_tblAlphagroup_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblCASHBANK"
    ADD CONSTRAINT "tblCASHBANK_BankAccount_0d90bc6d_fk_tblAlphagroup_id" FOREIGN KEY ("BankAccount") REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblCASHBANK_TRAN tblCASHBANK_TRAN_VoucherNo_7383c4d9_fk_tblCASHBANK_voucher_no; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblCASHBANK_TRAN"
    ADD CONSTRAINT "tblCASHBANK_TRAN_VoucherNo_7383c4d9_fk_tblCASHBANK_voucher_no" FOREIGN KEY ("VoucherNo") REFERENCES public."tblCASHBANK"(voucher_no) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblCASHBANK_TRAN tblCASHBANK_TRAN_accountmaster_id_168e0a25_fk_tblAccoun; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblCASHBANK_TRAN"
    ADD CONSTRAINT "tblCASHBANK_TRAN_accountmaster_id_168e0a25_fk_tblAccoun" FOREIGN KEY (accountmaster_id) REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblGateEntry tblGateEntry_created_by_id_3e403935_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblGateEntry"
    ADD CONSTRAINT "tblGateEntry_created_by_id_3e403935_fk_auth_user_id" FOREIGN KEY (created_by_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblGateEntry tblGateEntry_supplier_id_c0aed273_fk_tblAlphagroup_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblGateEntry"
    ADD CONSTRAINT "tblGateEntry_supplier_id_c0aed273_fk_tblAlphagroup_id" FOREIGN KEY (supplier_id) REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblPurchaseOrder_TRAN tblPurchaseOrder_TRAN_PONo_befb3715_fk_tblPurchaseOrder_po_no; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblPurchaseOrder_TRAN"
    ADD CONSTRAINT "tblPurchaseOrder_TRAN_PONo_befb3715_fk_tblPurchaseOrder_po_no" FOREIGN KEY ("PONo") REFERENCES public."tblPurchaseOrder"(po_no) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblPurchaseOrder_TRAN tblPurchaseOrder_TRAN_item_id_15398968_fk_tblMaterial_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblPurchaseOrder_TRAN"
    ADD CONSTRAINT "tblPurchaseOrder_TRAN_item_id_15398968_fk_tblMaterial_id" FOREIGN KEY (item_id) REFERENCES public."tblMaterial"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSalPurGroup tblSalPurGroup_GroupwiseAccountID_be613f5b_fk_tblAccoun; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSalPurGroup"
    ADD CONSTRAINT "tblSalPurGroup_GroupwiseAccountID_be613f5b_fk_tblAccoun" FOREIGN KEY ("GroupwiseAccountID") REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSalPurGroup_Tran tblSalPurGroup_Tran_ChargeAccountID_009807f3_fk_tblAccoun; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSalPurGroup_Tran"
    ADD CONSTRAINT "tblSalPurGroup_Tran_ChargeAccountID_009807f3_fk_tblAccoun" FOREIGN KEY ("ChargeAccountID") REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSalPurGroup_Tran tblSalPurGroup_Tran_SalPurGroupID_b11a8d7e_fk_tblSalPur; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSalPurGroup_Tran"
    ADD CONSTRAINT "tblSalPurGroup_Tran_SalPurGroupID_b11a8d7e_fk_tblSalPur" FOREIGN KEY ("SalPurGroupID") REFERENCES public."tblSalPurGroup"("SalPurGroupID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSectionC tblSectionC_BankAccount_246fc912_fk_tblAlphagroup_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSectionC"
    ADD CONSTRAINT "tblSectionC_BankAccount_246fc912_fk_tblAlphagroup_id" FOREIGN KEY ("BankAccount") REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSectionC_TRAN tblSectionC_TRAN_VoucherNo_dad46454_fk_tblSectionC_voucher_no; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSectionC_TRAN"
    ADD CONSTRAINT "tblSectionC_TRAN_VoucherNo_dad46454_fk_tblSectionC_voucher_no" FOREIGN KEY ("VoucherNo") REFERENCES public."tblSectionC"(voucher_no) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSectionC_TRAN tblSectionC_TRAN_accountmaster_id_897e3b72_fk_tblAccoun; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSectionC_TRAN"
    ADD CONSTRAINT "tblSectionC_TRAN_accountmaster_id_897e3b72_fk_tblAccoun" FOREIGN KEY (accountmaster_id) REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSubsectionB2 tblSubsectionB2_BankAccount_ba779399_fk_tblAlphagroup_id; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSubsectionB2"
    ADD CONSTRAINT "tblSubsectionB2_BankAccount_ba779399_fk_tblAlphagroup_id" FOREIGN KEY ("BankAccount") REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSubsectionB2_TRAN tblSubsectionB2_TRAN_VoucherNo_19ef3ff2_fk_tblSubsec; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSubsectionB2_TRAN"
    ADD CONSTRAINT "tblSubsectionB2_TRAN_VoucherNo_19ef3ff2_fk_tblSubsec" FOREIGN KEY ("VoucherNo") REFERENCES public."tblSubsectionB2"(voucher_no) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: tblSubsectionB2_TRAN tblSubsectionB2_TRAN_accountmaster_id_32d54d31_fk_tblAccoun; Type: FK CONSTRAINT; Schema: public; Owner: alpha_user
--

ALTER TABLE ONLY public."tblSubsectionB2_TRAN"
    ADD CONSTRAINT "tblSubsectionB2_TRAN_accountmaster_id_32d54d31_fk_tblAccoun" FOREIGN KEY (accountmaster_id) REFERENCES public."tblAccountmaster"(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO alpha_user;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO postgres;


--
-- PostgreSQL database dump complete
--

\unrestrict 3WRE6YXtrTBUj9o1S39584tgDIYeAUamGy16DddhJQMMsJgqdJ1g5n1oqgrUn2E

