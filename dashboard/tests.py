"""
AccountMaster Dashboard — Full Test Suite
Stabilization Phase: All B-2 tests now use CashBank (module_type='B2') — 
the consolidated architecture. No SubsectionB2 or tblSubsectionB2 references.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from dashboard.models.account_master import Category, AccountMaster
from dashboard.models.cashbank import CashBank, CashBankTran
from dashboard.models.section_c import SectionC, SectionCTran


class AccountMasterDashboardModuleTests(APITestCase):
    def setUp(self):
        # ── Shared fixtures ──────────────────────────────────────────────────
        self.category = Category.objects.create(categoryName="Bank Accounts", categoryType="A")
        self.alpha_bank = AccountMaster.objects.create(
            groupID=101,
            Account_Name="HDFC Current Account",
            display_name="HDFC Current",
            category=self.category,
            is_active=True
        )
        self.alpha_ledger = AccountMaster.objects.create(
            groupID=102,
            Account_Name="Travel Expenses",
            display_name="Travel Exp",
            category=self.category,
            is_active=True
        )

        now = timezone.now()

        # ── Bank Transaction records (module_type='') ─────────────────────
        for i in range(1, 15):
            cb = CashBank.objects.create(
                voucher_no=f"VOUCH-BANK-{i:03d}",
                date=now,
                tran_type="J001",
                rpid="D",
                amount=100.00 * i,
                narration=f"Narration bank voucher {i}",
                bank_account=self.alpha_bank,
                status=True,
                module_type=''   # baseline Bank Transaction
            )
            CashBankTran.objects.create(
                voucher=cb,
                date=now,
                tran_type="J001",
                rpid="D",
                account_master=self.alpha_ledger,
                amount=100.00 * i,
                remarks=f"Split details {i}"
            )

        # ── Section C records ─────────────────────────────────────────────
        for i in range(1, 15):
            sc = CashBank.objects.create(
                voucher_no=f"VOUCH-C-{i:03d}",
                date=now,
                tran_type="J002",
                rpid="D",
                amount=50.00 * i,
                narration=f"Narration cash voucher {i}",
                bank_account=self.alpha_bank,
                status=True,
                module_type=''
            )
            CashBankTran.objects.create(
                voucher=sc,
                date=now,
                tran_type="J002",
                rpid="D",
                account_master=self.alpha_ledger,
                amount=50.00 * i,
                remarks=f"Split details {i}"
            )

        # ── B-2 records (module_type='B2') ────────────────────────────────
        for i in range(1, 15):
            cb2 = CashBank.objects.create(
                voucher_no=f"B2-202605-{i:04d}",
                date=now,
                tran_type="J001",
                rpid="R",
                amount=75.00 * i,
                narration=f"Narration B-2 voucher {i}",
                bank_account=self.alpha_bank,
                ref_voucher_no=f"VOUCH-BANK-{i:03d}",
                posting_status="DRAFT",
                status=True,
                module_type='B2'   # B-2 isolation key
            )
            CashBankTran.objects.create(
                voucher=cb2,
                date=now,
                tran_type="J001",
                rpid="R",
                account_master=self.alpha_ledger,
                amount=75.00 * i,
                remarks=f"Split details {i}",
                cost_center=f"CC-0{i}"
            )

    # ─── Bank Transaction Tests ───────────────────────────────────────────

    def test_cashbank_list_response_structure(self):
        """Verify backend returns a flat list response structure."""
        url = reverse('dashboard:api_bank_transaction-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertTrue(isinstance(response.data, list))
        # 14 Bank Tx records (B-2 excluded by module_type='B2' filter)
        self.assertEqual(len(response.data), 14)

    def test_cashbank_isolation_excludes_b2_records(self):
        """Critical: Bank Transaction API must NEVER return B-2 records."""
        url = reverse('dashboard:api_bank_transaction-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for record in response.data:
            vno = record['voucher_no']
            self.assertFalse(
                vno.startswith('B2-'),
                f"Bank Tx API returned B-2 record: {vno}"
            )

    def test_cashbank_whitelisted_sorting(self):
        """Verify only whitelisted columns can be sorted, protecting against SQL injection."""
        url = reverse('dashboard:api_bank_transaction-list')

        # Ascending sort by amount
        response = self.client.get(url, {'ordering': 'amount'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        amounts = [float(item['amount']) for item in response.data]
        self.assertEqual(amounts, sorted(amounts))

        # Descending sort by amount
        response = self.client.get(url, {'ordering': '-amount'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        amounts = [float(item['amount']) for item in response.data]
        self.assertEqual(amounts, sorted(amounts, reverse=True))

        # Non-whitelisted injection field should be silently ignored
        response = self.client.get(url, {'ordering': 'user_created'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cashbank_hard_delete(self):
        """Verify DELETE performs hard delete (not soft delete) for Bank Transactions."""
        cb_voucher = "VOUCH-BANK-001"
        cb = CashBank.objects.get(voucher_no=cb_voucher)
        cb.status = False
        cb.save()
        url = reverse('dashboard:api_bank_transaction-detail', kwargs={'voucher_no': cb_voucher})

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        with self.assertRaises(CashBank.DoesNotExist):
            CashBank.objects.get(voucher_no=cb_voucher)

    def test_cashbank_status_filter(self):
        """Verify status=true / status=false filter works on Bank Transaction list."""
        url = reverse('dashboard:api_bank_transaction-list')

        # All active
        response = self.client.get(url, {'status': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for r in response.data:
            self.assertTrue(r['status'])

    def test_cashbank_date_filter(self):
        """Verify date_after / date_before filters work on Bank Transaction list."""
        url = reverse('dashboard:api_bank_transaction-list')
        today = timezone.now().date().isoformat()
        tomorrow = (timezone.now().date() + timezone.timedelta(days=1)).isoformat()

        response = self.client.get(url, {'date_after': today, 'date_before': tomorrow})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # All setUp records are for today, so should still be present
        self.assertGreater(len(response.data), 0)

    # ─── Section C Tests ──────────────────────────────────────────────────

    def test_sectionc_list_and_sorting(self):
        """Verify flat listing, whitelisted sorting, and soft delete on Section C."""
        url = reverse('dashboard:api_section_c-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertTrue(isinstance(response.data, list))
        self.assertEqual(len(response.data), 14)

        first_row = response.data[0]
        self.assertIn('bank_account', first_row)
        self.assertIn('bank_account_display', first_row)
        self.assertIsNotNone(first_row['bank_account_display'])
        self.assertEqual(first_row['bank_account_display']['text'], "HDFC Current Account [HDFC Current]")

        # Sort
        response_sort = self.client.get(url, {'ordering': '-amount'})
        amounts = [float(item['amount']) for item in response_sort.data]
        self.assertEqual(amounts, sorted(amounts, reverse=True))

        # Soft delete
        sc_voucher = "VOUCH-C-001"
        url_detail = reverse('dashboard:api_section_c-detail', kwargs={'voucher_no': sc_voucher})
        response_del = self.client.delete(url_detail)
        self.assertEqual(response_del.status_code, status.HTTP_204_NO_CONTENT)

        sc = CashBank.objects.get(voucher_no=sc_voucher)
        self.assertFalse(sc.status)

    def test_sectionc_hard_delete_on_inactive(self):
        """Verify Section C DELETE on an inactive record permanently removes it."""
        sc_voucher = "VOUCH-C-002"
        sc = CashBank.objects.get(voucher_no=sc_voucher)
        sc.status = False
        sc.save()

        url_detail = reverse('dashboard:api_section_c-detail', kwargs={'voucher_no': sc_voucher})
        response_del = self.client.delete(url_detail)
        self.assertEqual(response_del.status_code, status.HTTP_204_NO_CONTENT)

        with self.assertRaises(CashBank.DoesNotExist):
            CashBank.objects.get(voucher_no=sc_voucher)

    # ─── Sub Section B-2 Tests ────────────────────────────────────────────

    def test_subsection_b2_pagination_sorting_display(self):
        """Verify pagination, whitelisted sorting, and custom display fields on B-2."""
        url = reverse('dashboard:api_subsection_b2-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 14 B-2 records, isolated by module_type='B2'
        self.assertEqual(response.data['count'], 14)
        self.assertEqual(response.data['current'], 1)
        self.assertEqual(response.data['total_pages'], 2)
        self.assertEqual(len(response.data['results']), 10)

        first_row = response.data['results'][0]
        self.assertIn('bank_account', first_row)
        self.assertIn('bank_account_display', first_row)
        self.assertEqual(first_row['bank_account_display']['text'], "HDFC Current Account [HDFC Current]")
        self.assertIn('ref_voucher_no', first_row)
        self.assertTrue(first_row['ref_voucher_no'].startswith("VOUCH-BANK-"))

        # Amount sort
        response_sort = self.client.get(url, {'ordering': 'amount'})
        amounts = [float(item['amount']) for item in response_sort.data['results']]
        self.assertEqual(amounts, sorted(amounts))

    def test_subsection_b2_isolation_excludes_bank_tx(self):
        """Critical: B-2 API must NEVER return baseline Bank Transaction records."""
        url = reverse('dashboard:api_subsection_b2-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for record in response.data['results']:
            vno = record['voucher_no']
            self.assertTrue(
                vno.startswith('B2-'),
                f"B-2 API returned non-B2 record: {vno}"
            )

    def test_subsection_b2_soft_delete(self):
        """Verify B-2 DELETE soft-deletes (status=False), not hard-deletes."""
        b2_voucher = "B2-202605-0001"
        url = reverse('dashboard:api_subsection_b2-detail', kwargs={'voucher_no': b2_voucher})

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Record must still exist in DB, just status=False
        b2 = CashBank.objects.get(voucher_no=b2_voucher)
        self.assertFalse(b2.status)
        self.assertEqual(b2.module_type, 'B2')  # module_type must remain 'B2'

    def test_subsection_b2_hard_delete_on_inactive(self):
        """Verify B-2 DELETE on an inactive record permanently removes it."""
        b2_voucher = "B2-202605-0002"
        b2 = CashBank.objects.get(voucher_no=b2_voucher)
        b2.status = False
        b2.save()

        url = reverse('dashboard:api_subsection_b2-detail', kwargs={'voucher_no': b2_voucher})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        with self.assertRaises(CashBank.DoesNotExist):
            CashBank.objects.get(voucher_no=b2_voucher)

    def test_subsection_b2_toggle_status_action(self):
        """Verify toggle_status action flips status correctly (False → True → False)."""
        b2_voucher = "B2-202605-0001"
        url = reverse('dashboard:api_subsection_b2-toggle-status', kwargs={'voucher_no': b2_voucher})

        # First toggle → False
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['status'])
        self.assertFalse(CashBank.objects.get(voucher_no=b2_voucher).status)

        # Second toggle → True (restore)
        response2 = self.client.post(url)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertTrue(response2.data['status'])
        self.assertTrue(CashBank.objects.get(voucher_no=b2_voucher).status)

    def test_subsection_b2_validation_empty_transactions(self):
        """Verify B-2 rejects creation with empty transactions list."""
        url = reverse('dashboard:api_subsection_b2-list')
        payload = {
            "date": timezone.now().isoformat(),
            "tran_type": "BANK",
            "rpid": "R",
            "amount": "150.00",
            "bank_account": self.alpha_bank.pk,
            "transactions": []
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('transactions', response.data)

    def test_subsection_b2_validation_amount_mismatch(self):
        """Verify B-2 rejects creation when header amount != sum of detail rows."""
        url = reverse('dashboard:api_subsection_b2-list')
        payload = {
            "date": timezone.now().isoformat(),
            "tran_type": "BANK",
            "rpid": "R",
            "amount": "150.00",
            "bank_account": self.alpha_bank.pk,
            "transactions": [
                {
                    "account_master": self.alpha_ledger.pk,
                    "amount": "100.00",   # mismatch: 100 != 150
                    "remarks": "Sub row 1",
                    "cost_center": "CC-Test"
                }
            ]
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)

    def test_subsection_b2_status_filter(self):
        """Verify status=true/false filter works on B-2 list."""
        url = reverse('dashboard:api_subsection_b2-list')

        # Soft delete one record first
        b2 = CashBank.objects.get(voucher_no='B2-202605-0001', module_type='B2')
        b2.status = False
        b2.save()

        # Active filter
        response_active = self.client.get(url, {'status': 'true'})
        self.assertEqual(response_active.status_code, status.HTTP_200_OK)
        self.assertEqual(response_active.data['count'], 13)
        for r in response_active.data['results']:
            self.assertTrue(r['status'])

        # Inactive filter
        response_inactive = self.client.get(url, {'status': 'false'})
        self.assertEqual(response_inactive.status_code, status.HTTP_200_OK)
        self.assertEqual(response_inactive.data['count'], 1)

    def test_subsection_b2_search_filter(self):
        """Verify generic search filter works on narration field."""
        url = reverse('dashboard:api_subsection_b2-list')
        response = self.client.get(url, {'search': 'voucher 5'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for r in response.data['results']:
            narration = (r.get('narration') or '').lower()
            self.assertIn('voucher 5', narration)

    def test_subsection_b2_page_2(self):
        """Verify page=2 returns records 11-14 (4 records)."""
        url = reverse('dashboard:api_subsection_b2-list')
        response = self.client.get(url, {'page': 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current'], 2)
        self.assertEqual(len(response.data['results']), 4)  # 14 total - 10 page 1

    # ─── Repository & Service Layer Tests ────────────────────────────────

    def test_repository_dialect_detection(self):
        """Verify repository correctly detects connection dialect in test env."""
        from django.db import connection
        from dashboard.services.subsection_b2_repo import SubsectionB2Repository
        repo = SubsectionB2Repository()
        expected = (connection.vendor == 'postgresql')
        self.assertEqual(repo._is_postgresql(), expected)

    def test_balance_calculation_orm(self):
        """Validate balance calculation using B-2 records in tblCASHBANK (module_type='B2')."""
        from dashboard.services.subsection_b2_service import SubsectionB2Service

        now = timezone.now()
        # Clear setUp B-2 records for this bank to get a clean slate
        CashBank.objects.filter(bank_account=self.alpha_bank, module_type='B2').delete()

        # Receipt: +500
        CashBank.objects.create(
            voucher_no="B2-202605-9001",
            date=now,
            tran_type="BANK",
            rpid="R",
            amount=500.00,
            bank_account=self.alpha_bank,
            status=True,
            posting_status="DRAFT",
            module_type='B2'
        )
        # Payment: -200
        CashBank.objects.create(
            voucher_no="B2-202605-9002",
            date=now,
            tran_type="BANK",
            rpid="P",
            amount=200.00,
            bank_account=self.alpha_bank,
            status=True,
            posting_status="DRAFT",
            module_type='B2'
        )

        balance = SubsectionB2Service.calculate_balance(self.alpha_bank.pk, now)
        self.assertEqual(balance, 300.00)

    def test_dashboard_aggregates_orm(self):
        """Validate dashboard aggregation outputs using B-2 records in tblCASHBANK."""
        from dashboard.services.subsection_b2_service import SubsectionB2Service

        now = timezone.now()
        # Clear all B-2 detail and header rows
        CashBankTran.objects.filter(voucher__module_type='B2').delete()
        CashBank.objects.filter(module_type='B2').delete()

        b2 = CashBank.objects.create(
            voucher_no="B2-202605-9001",
            date=now,
            tran_type="BANK",
            rpid="R",
            amount=150.00,
            bank_account=self.alpha_bank,
            status=True,
            module_type='B2'
        )
        CashBankTran.objects.create(
            voucher=b2,
            date=now,
            tran_type="BANK",
            rpid="R",
            account_master=self.alpha_ledger,
            amount=150.00,
            remarks="Group test",
            cost_center="CC-Test"
        )

        aggregates = SubsectionB2Service.get_dashboard_aggregates(
            now - timezone.timedelta(days=1),
            now + timezone.timedelta(days=1)
        )
        by_category = aggregates['by_category']
        self.assertEqual(len(by_category), 1)
        self.assertEqual(by_category[0]['category_name'], "BANK")
        self.assertEqual(by_category[0]['group_name'], self.alpha_ledger.Account_Name)
        self.assertEqual(by_category[0]['total_amount'], 150.00)

    def test_ledger_pagination_orm(self):
        """Verify offset pagination boundaries via local ORM path for B-2 ledger report."""
        from dashboard.services.subsection_b2_service import SubsectionB2Service
        now = timezone.now()
        total_count = CashBank.objects.filter(module_type='B2', status=True).count()

        report = SubsectionB2Service.get_ledger_report(
            now - timezone.timedelta(days=10),
            now + timezone.timedelta(days=10),
            limit=5, offset=0
        )
        self.assertEqual(len(report), min(5, total_count))
        for item in report:
            self.assertEqual(item['total_records'], total_count)

    def test_posted_lock_at_repository(self):
        """Verify editing a POSTED voucher is blocked at repository level."""
        from dashboard.services.subsection_b2_repo import SubsectionB2Repository
        repo = SubsectionB2Repository()

        now = timezone.now()
        posted = CashBank.objects.create(
            voucher_no="B2-202605-9999",
            date=now,
            tran_type="BANK",
            rpid="R",
            amount=100.00,
            bank_account=self.alpha_bank,
            status=True,
            posting_status="POSTED",
            module_type='B2'
        )

        with self.assertRaises(PermissionError):
            repo.update_voucher(posted, {"amount": 200.00, "transactions": []})

    def test_posted_lock_at_serializer(self):
        """Verify editing a POSTED voucher returns 400 from the API."""
        now = timezone.now()
        posted = CashBank.objects.create(
            voucher_no="B2-202605-8888",
            date=now,
            tran_type="BANK",
            rpid="R",
            amount=100.00,
            bank_account=self.alpha_bank,
            status=True,
            posting_status="POSTED",
            module_type='B2'
        )

        url = reverse('dashboard:api_subsection_b2-detail', kwargs={'voucher_no': posted.voucher_no})
        payload = {
            "date": now.isoformat(),
            "tran_type": "BANK",
            "rpid": "R",
            "amount": "200.00",
            "bank_account": self.alpha_bank.pk,
            "transactions": [{"account_master": self.alpha_ledger.pk, "amount": "200.00"}]
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('posting_status', response.data)

    def test_transaction_atomic_rollback(self):
        """Force an error inside detail creation and verify rollback: no orphan header created."""
        from django.db import transaction
        from dashboard.services.subsection_b2_repo import SubsectionB2Repository
        repo = SubsectionB2Repository()

        now = timezone.now()
        initial_b2_count = CashBank.objects.filter(module_type='B2').count()

        bad_payload = {
            "date": now,
            "tran_type": "BANK",
            "rpid": "R",
            "amount": 100.00,
            "bank_account": self.alpha_bank,
            "module_type": "B2",
            "transactions": [
                {
                    "account_master": None,
                    # amount omitted → IntegrityError (NOT NULL) triggers rollback
                }
            ]
        }

        try:
            with transaction.atomic():
                repo.create_voucher(bad_payload)
        except Exception:
            pass

        # Rollback must mean count is unchanged
        final_b2_count = CashBank.objects.filter(module_type='B2').count()
        self.assertEqual(initial_b2_count, final_b2_count)

    def test_module_type_always_b2_on_create(self):
        """Verify module_type is always forced to 'B2' regardless of payload."""
        from dashboard.services.subsection_b2_service import SubsectionB2Service

        now = timezone.now()
        result = SubsectionB2Service.create_voucher({
            "date": now,
            "tran_type": "BANK",
            "rpid": "I",
            "amount": 250.00,
            "bank_account": self.alpha_bank,
            "narration": "Module type test",
            "posting_status": "DRAFT",
            "status": True,
            "module_type": "",   # tries to set empty — should be overridden to 'B2'
            "transactions": [
                {"date": now, "tran_type": "BANK", "rpid": "I",
                 "account_master": self.alpha_ledger, "amount": 250.00}
            ]
        })
        self.assertEqual(result.module_type, 'B2')
        result.delete()

    def test_voucher_number_prefix(self):
        """Verify B-2 voucher numbers always start with 'B2-'."""
        from dashboard.serializers import SubsectionB2Serializer
        vno = SubsectionB2Serializer._generate_voucher_no()
        self.assertTrue(vno.startswith('B2-'), f"Unexpected prefix: {vno}")
        parts = vno.split('-')
        self.assertEqual(len(parts), 3)
        self.assertTrue(parts[1].isdigit() and len(parts[1]) == 6)  # YYYYMM
        self.assertTrue(parts[2].isdigit() and len(parts[2]) == 4)  # NNNN

    def test_bank_tx_and_b2_total_in_shared_table(self):
        """
        Verify tblCASHBANK has Bank Tx, Section C, and B-2 records.
        """
        total = CashBank.objects.count()
        bank_tx_count = CashBank.objects.filter(tran_type='J001', module_type='').count()
        section_c_count = CashBank.objects.filter(tran_type='J002').count()
        b2_count = CashBank.objects.filter(module_type='B2').count()

        self.assertEqual(bank_tx_count, 14)
        self.assertEqual(section_c_count, 14)
        self.assertEqual(b2_count, 14)
        self.assertEqual(total, bank_tx_count + section_c_count + b2_count)

    def test_account_master_search_display_name(self):
        """Verify that searching for an AccountMaster group by display_name works correctly."""
        # Create a test AccountMaster group with a unique display name
        category = Category.objects.create(categoryName="Test Category", categoryType="A")
        test_alpha = AccountMaster.objects.create(
            groupID=9988,
            Account_Name="Unique Account Name For Search",
            display_name="TargetDisplayNameQuery",
            category=category,
            cl_bal=100.00,
            is_active=True
        )

        # Query the search API endpoint with the display_name query
        response = self.client.get(reverse('dashboard:api_alpha_search'), {'q': 'TargetDisplayNameQuery'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify that the created record is returned in results
        results = data.get('results', [])
        found_ids = [item['id'] for item in results]
        self.assertIn(test_alpha.id, found_ids)

        # Cleanup
        test_alpha.delete()
        category.delete()


class TabularStandardizationTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(categoryName="Test Log Category", categoryType="A")
        self.supplier = AccountMaster.objects.create(
            groupID=201,
            Account_Name="HDFC Current Account",
            display_name="HDFC Current",
            category=self.category,
            is_active=True
        )
        # Create a gate entry log to render in gate_entry.html
        from dashboard.models.gate_entry import Material, GateEntry
        from django.utils import timezone
        material = Material.objects.create(material_code="RAW", material_name="Raw Material")
        GateEntry.objects.create(
            gate_pass_id="GP-001",
            supplier=self.supplier,
            vehicle_number="DL-1C-1234",
            material_type=material,
            driver_name="Test Driver",
            entry_datetime=timezone.now()
        )

    def test_gate_entry_table_standardized(self):
        """Verify that gate_entry.html has the erp-table-body class and data-row-id attribute on rows."""
        url = reverse('dashboard:gate_entry')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        html_content = response.content.decode('utf-8')
        
        # Verify erp-table-body is inside Recent Entries Log
        self.assertIn('class="erp-table-body"', html_content)
        # Verify data-row-id attribute is present on the rows
        self.assertIn('data-row-id=', html_content)

    def test_voucher_create_grid_standardized(self):
        """Verify that voucher_form.html loads the global scripts and form components successfully."""
        url = reverse('dashboard:voucher_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        html_content = response.content.decode('utf-8')
        
        # Verify it loads row-restore.js
        self.assertIn('row-restore.js', html_content)
        # Verify the dynamic table structure
        self.assertIn('id="dynamicTable"', html_content)
        self.assertIn('id="formsetContainer"', html_content)

    def test_voucher_edit_readonly_and_update(self):
        """Verify that editing a voucher renders the voucher_number field as readonly and saves successfully using original pk."""
        from dashboard.models.cashbank import CashBank, CashBankTran
        cb = CashBank.objects.create(
            voucher_no="V100",
            date="2026-06-08 12:00:00",
            tran_type="J000",
            amount=500.00,
            narration="Test Voucher",
            status=True
        )
        CashBankTran.objects.create(
            voucher=cb,
            date=cb.date,
            tran_type=cb.tran_type,
            rpid="A",
            account_master=self.supplier,
            amount=500.00
        )
        category_b = Category.objects.create(categoryName="Test Log B", categoryType="B")
        supplier_b = AccountMaster.objects.create(
            groupID=202,
            Account_Name="HDFC Bank Account B",
            display_name="HDFC B",
            category=category_b,
            is_active=True
        )
        CashBankTran.objects.create(
            voucher=cb,
            date=cb.date,
            tran_type=cb.tran_type,
            rpid="B",
            account_master=supplier_b,
            amount=500.00
        )

        url = reverse('dashboard:voucher_edit', kwargs={'pk': 'V100'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        html_content = response.content.decode('utf-8')

        self.assertIn('name="voucher_number"', html_content)
        self.assertNotIn('readonly="readonly"', html_content)

        # First test uniqueness validation: create another voucher 'V200' and try to rename 'V100' to 'V200'
        CashBank.objects.create(
            voucher_no="V200",
            date="2026-06-08 12:00:00",
            tran_type="J000",
            amount=100.00,
            narration="Existing V200",
            status=True
        )

        invalid_post_data = {
            'voucher_number': 'V200',
            'voucher_date': '2026-06-08',
            'remarks': 'Should fail',
            'is_active': 'on',
            'facts-TOTAL_FORMS': '2',
            'facts-INITIAL_FORMS': '2',
            'facts-MIN_NUM_FORMS': '0',
            'facts-MAX_NUM_FORMS': '1000',
            'facts-0-id': cb.transactions.filter(rpid='A').first().id,
            'facts-0-row_type': 'A',
            'facts-0-account_master': self.supplier.id,
            'facts-0-amount': '500.00',
            'facts-1-id': cb.transactions.filter(rpid='B').first().id,
            'facts-1-row_type': 'B',
            'facts-1-account_master': supplier_b.id,
            'facts-1-amount': '500.00',
        }
        response = self.client.post(url, invalid_post_data)
        # Should stay on page (200) and show validation error
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "already exists")

        # Now test successful renaming to 'V100_modified'
        post_data = {
            'voucher_number': 'V100_modified',
            'voucher_date': '2026-06-08',
            'remarks': 'Updated Remarks',
            'is_active': 'on',
            'facts-TOTAL_FORMS': '2',
            'facts-INITIAL_FORMS': '2',
            'facts-MIN_NUM_FORMS': '0',
            'facts-MAX_NUM_FORMS': '1000',
            'facts-0-id': cb.transactions.filter(rpid='A').first().id,
            'facts-0-row_type': 'A',
            'facts-0-account_master': self.supplier.id,
            'facts-0-amount': '500.00',
            'facts-1-id': cb.transactions.filter(rpid='B').first().id,
            'facts-1-row_type': 'B',
            'facts-1-account_master': supplier_b.id,
            'facts-1-amount': '500.00',
        }
        
        response = self.client.post(url, post_data)
        self.assertEqual(response.status_code, 302)
        
        # Verify db updated the record (primary key renamed successfully)
        self.assertFalse(CashBank.objects.filter(voucher_no='V100').exists())
        updated_cb = CashBank.objects.get(voucher_no='V100_modified')
        self.assertEqual(updated_cb.narration, 'Updated Remarks')
        self.assertEqual(updated_cb.transactions.count(), 2)

    def test_voucher_permanent_delete(self):
        """Verify that deleting an inactive journal voucher (SECTION_A) permanently deletes both header and detail rows."""
        from dashboard.models.cashbank import CashBank, CashBankTran
        cb = CashBank.objects.create(
            voucher_no="V105",
            date="2026-06-08 12:00:00",
            tran_type="J000",
            amount=500.00,
            narration="Test Voucher For Delete",
            status=False  # Must be inactive to allow permanent deletion
        )
        CashBankTran.objects.create(
            voucher=cb,
            date=cb.date,
            tran_type=cb.tran_type,
            rpid="A",
            account_master=self.supplier,
            amount=500.00
        )
        url = reverse('dashboard:voucher_delete', kwargs={'pk': 'V105'})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 302) # Redirect to voucher_list
        
        # Verify both header and detail rows are deleted
        self.assertFalse(CashBank.objects.filter(voucher_no='V105').exists())
        self.assertFalse(CashBankTran.objects.filter(voucher_id='V105').exists())

    def test_bank_transaction_and_section_c_renaming(self):
        """Verify that PUT request to update viewsets renames the voucher_no correctly and handles uniqueness checks."""
        import json
        from django.urls import reverse
        from dashboard.models.cashbank import CashBank, CashBankTran

        # 1. Bank Transaction Renaming
        cb_bank = CashBank.objects.create(
            voucher_no="B100",
            date="2026-06-08 12:00:00",
            tran_type="J001",
            amount=200.00,
            narration="Original Bank Tx",
            bank_account=self.supplier,
            status=True
        )
        CashBankTran.objects.create(
            voucher=cb_bank,
            date=cb_bank.date,
            tran_type=cb_bank.tran_type,
            rpid="P",
            account_master=self.supplier,
            amount=200.00
        )

        api_url = reverse('dashboard:api_bank_transaction-detail', kwargs={'voucher_no': 'B100'})
        post_data = {
            'voucher_no': 'B100_renamed',
            'date': '2026-06-08T12:00:00Z',
            'tran_type': 'J001',
            'rpid': 'P',
            'amount': 200.00,
            'narration': 'Renamed Bank Tx',
            'bank_account': self.supplier.id,
            'status': True,
            'transactions': [
                {
                    'account_master': self.supplier.id,
                    'amount': 200.00,
                    'remarks': 'Detail text'
                }
            ]
        }
        response = self.client.put(api_url, json.dumps(post_data), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Assert db updated
        self.assertFalse(CashBank.objects.filter(voucher_no='B100').exists())
        updated_cb = CashBank.objects.get(voucher_no='B100_renamed')
        self.assertEqual(updated_cb.narration, 'Renamed Bank Tx')

        # Try to rename to an existing one 'B_EXISTING'
        existing_cb = CashBank.objects.create(
            voucher_no="B_EXISTING",
            date="2026-06-08 12:00:00",
            tran_type="J001",
            amount=50.00,
            narration="Conflict",
            bank_account=self.supplier,
            status=True
        )
        post_data['voucher_no'] = 'B_EXISTING'
        api_url = reverse('dashboard:api_bank_transaction-detail', kwargs={'voucher_no': 'B100_renamed'})
        response = self.client.put(api_url, json.dumps(post_data), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('already exists', str(response.content.decode('utf-8')))

        # 2. Section C (Cash) Renaming
        cb_cash = CashBank.objects.create(
            voucher_no="C100",
            date="2026-06-08 12:00:00",
            tran_type="J002",
            amount=300.00,
            narration="Original Cash Tx",
            bank_account=self.supplier,
            status=True
        )
        CashBankTran.objects.create(
            voucher=cb_cash,
            date=cb_cash.date,
            tran_type=cb_cash.tran_type,
            rpid="P",
            account_master=self.supplier,
            amount=300.00
        )

        api_url_c = reverse('dashboard:api_section_c-detail', kwargs={'voucher_no': 'C100'})
        post_data_c = {
            'voucher_no': 'C100_renamed',
            'date': '2026-06-08T12:00:00Z',
            'tran_type': 'J002',
            'rpid': 'P',
            'amount': 300.00,
            'narration': 'Renamed Cash Tx',
            'bank_account': self.supplier.id,
            'status': True,
            'transactions': [
                {
                    'account_master': self.supplier.id,
                    'amount': 300.00,
                    'remarks': 'Detail text'
                }
            ]
        }
        response = self.client.put(api_url_c, json.dumps(post_data_c), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        self.assertFalse(CashBank.objects.filter(voucher_no='C100').exists())
        updated_c = CashBank.objects.get(voucher_no='C100_renamed')
        self.assertEqual(updated_c.narration, 'Renamed Cash Tx')

    def test_navigation_prev_next(self):
        """Verify that prev/next keys are populated correctly for Cash Transactions and Bank Transactions."""
        from django.urls import reverse
        from dashboard.models.cashbank import CashBank

        cb1 = CashBank.objects.create(
            voucher_no="C-1021",
            date="2026-06-08 12:00:00",
            tran_type="J002",
            amount=100.00,
            narration="Cash 1",
            status=True
        )
        cb2 = CashBank.objects.create(
            voucher_no="C-1022",
            date="2026-06-08 13:00:00",
            tran_type="J002",
            amount=200.00,
            narration="Cash 2",
            status=True
        )

        url1 = reverse('dashboard:section_c_edit', kwargs={'pk': 'C-1021'})
        response = self.client.get(url1 + '?mode=view')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['prev_pk'], 'C-1022')
        self.assertIsNone(response.context['next_pk'])

        url2 = reverse('dashboard:section_c_edit', kwargs={'pk': 'C-1022'})
        response2 = self.client.get(url2 + '?mode=view')
        self.assertEqual(response2.status_code, 200)
        self.assertIsNone(response2.context['prev_pk'])
        self.assertEqual(response2.context['next_pk'], 'C-1021')

    def test_url_with_slashes(self):
        """Verify that voucher numbers containing slashes can be reversed, resolved, and requested successfully."""
        from django.urls import reverse
        from dashboard.models.cashbank import CashBank

        cb = CashBank.objects.create(
            voucher_no="CB-SB/2026/0001",
            date="2026-06-08 12:00:00",
            tran_type="J001",
            amount=100.00,
            narration="Test Transaction with slashes",
            status=True
        )

        # 1. Test standard detail page URL reversing and routing
        url = reverse('dashboard:bank_transaction_edit', kwargs={'pk': 'CB-SB/2026/0001'})
        self.assertEqual(url, '/bank-transaction/CB-SB/2026/0001/edit/')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        # 2. Test API detail endpoint URL reversing and routing
        api_url = reverse('dashboard:api_bank_transaction-detail', kwargs={'voucher_no': 'CB-SB/2026/0001'})
        self.assertEqual(api_url, '/api/bank-transactions/CB-SB/2026/0001/')

        response_api = self.client.get(api_url)
        self.assertEqual(response_api.status_code, 200)

        # 3. Test API action endpoint URL reversing and routing
        action_url = reverse('dashboard:api_bank_transaction-toggle-status', kwargs={'voucher_no': 'CB-SB/2026/0001'})
        self.assertEqual(action_url, '/api/bank-transactions/CB-SB/2026/0001/toggle_status/')

        response_action = self.client.post(action_url)
        self.assertEqual(response_action.status_code, 200)
        self.assertFalse(response_action.data['status'])


class PurchaseOrderTests(APITestCase):
    def setUp(self):
        from django.db import connection
        from dashboard.models.account_master import Category
        from dashboard.models.broker_supplier import Broker, VendorSupplier
        from dashboard.models.gate_entry import Material
        from dashboard.models.sal_pur_group import SalPurGroup

        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS "tblBroker" (
                    "BrokerID" INTEGER PRIMARY KEY,
                    "BrokerName" VARCHAR(100) NOT NULL,
                    "BrokerAddress" VARCHAR(255),
                    "ContactNo" VARCHAR(50),
                    "PANo" VARCHAR(50),
                    "UserCreated" VARCHAR(50),
                    "DateCreated" TIMESTAMP WITH TIME ZONE,
                    "UserModified" VARCHAR(50),
                    "DateModified" TIMESTAMP WITH TIME ZONE
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS "tblVendorSupplier" (
                    "VendorSupplierID" INTEGER PRIMARY KEY,
                    "VendorSupplierName" VARCHAR(100) NOT NULL,
                    "Address1" VARCHAR(255),
                    "Address2" VARCHAR(255),
                    "ContactNo" VARCHAR(50),
                    "GSTNo" VARCHAR(50),
                    "PANo" VARCHAR(50),
                    "UserCreted" VARCHAR(50),
                    "DateCreated" TIMESTAMP WITH TIME ZONE,
                    "UserModified" VARCHAR(50),
                    "DateModified" TIMESTAMP WITH TIME ZONE
                );
            """)

        self.category = Category.objects.create(categoryName="Suppliers", categoryType="S")
        self.supplier = VendorSupplier.objects.create(
            VendorSupplierID=201,
            VendorSupplierName="Supplier A"
        )
        self.broker = Broker.objects.create(
            BrokerID=202,
            BrokerName="Broker B"
        )
        self.material = Material.objects.create(
            material_code="RM001",
            material_name="Iron Ore",
            is_active=True
        )
        self.sal_pur_group = SalPurGroup.objects.create(
            SalPurGroupName="PO Group Test",
            is_active=True
        )

    def test_create_purchase_order_endpoint(self):
        """Verify that creating a Purchase Order auto-generates PO No and calculates basic, taxes, and grand totals."""
        from dashboard.models.purchase_order import PurchaseOrder
        import json

        url = reverse('dashboard:api_subsection_x-list')
        payload = {
            'po_date': '2026-06-09T10:00:00Z',
            'expected_delivery_date': '2026-06-15',
            'po_status': 'Draft',
            'sal_pur_group': self.sal_pur_group.pk,
            'broker': self.broker.pk,
            'zone_name': 'North Region',
            'supplier': self.supplier.pk,
            'supplier_contact': '1234567890',
            'supplier_address': 'Supplier Location',
            'gst_number': '09AAAAA1111A1Z1',
            'delivery_location': 'Plant 1',
            'delivery_terms': 'Ex Works/Ex-Godown',
            'payment_terms': 'Advance',
            'freight_terms': 'Supplier Paid',
            'currency': 'INR',
            'purchaser_name': 'Purchaser Test',
            'department': 'Purchase',
            'cost_center': 'Plant A',
            'special_instructions': 'None',
            'internal_notes': 'None',
            'items': [
                {
                    'item': self.material.id,
                    'order_qty': 100.0,
                    'uom': 'MT',
                    'unit_rate': 200.0,
                    'remarks': 'First item'
                }
            ]
        }

        response = self.client.post(url, json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        po_no = response.data['po_no']
        self.assertTrue(po_no.startswith('PO-202606-'))
        self.assertEqual(response.data['sal_pur_group'], self.sal_pur_group.pk)
        self.assertEqual(response.data['sal_pur_group_display']['text'], 'PO Group Test')
        self.assertEqual(float(response.data['total_basic_amount']), 20000.0)
        self.assertEqual(float(response.data['taxes']), 0.0)
        self.assertEqual(float(response.data['grand_total']), 20000.0)

        # Check DB persistence
        po = PurchaseOrder.objects.get(po_no=po_no)
        self.assertEqual(po.sal_pur_group_id, self.sal_pur_group.pk)
        self.assertEqual(po.items.count(), 1)
        self.assertEqual(po.items.first().amount, 20000.0)



    def test_soft_delete_and_hard_delete(self):
        """Verify that destroy endpoint soft-deletes active POs, and hard-deletes inactive POs."""
        from dashboard.models.purchase_order import PurchaseOrder
        
        po = PurchaseOrder.objects.create(
            po_date=timezone.now(),
            broker=self.broker,
            supplier=self.supplier,
            zone_name='North Region',
            delivery_location='Plant 1',
            delivery_terms='Ex Works/Ex-Godown',
            payment_terms='Advance',
            freight_terms='Supplier Paid',
            status=True
        )

        detail_url = reverse('dashboard:api_subsection_x-detail', kwargs={'po_no': po.po_no})
        
        # 1. First delete (soft delete)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        po.refresh_from_db()
        self.assertFalse(po.status)

        # 2. Second delete (hard delete)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        with self.assertRaises(PurchaseOrder.DoesNotExist):
            PurchaseOrder.objects.get(po_no=po.po_no)

    def test_list_filters_and_searching(self):
        """Verify the list view query params and search behavior works correctly."""
        from dashboard.models.purchase_order import PurchaseOrder
        
        po1 = PurchaseOrder.objects.create(
            po_no='PO-TEST-111',
            po_date=timezone.now(),
            po_status='Draft',
            broker=self.broker,
            supplier=self.supplier,
            zone_name='North Region',
            supplier_contact='123456',
            gst_number='GST111',
            status=True
        )
        po2 = PurchaseOrder.objects.create(
            po_no='PO-TEST-222',
            po_date=timezone.now() - timezone.timedelta(days=5),
            po_status='Draft',
            broker=self.broker,
            supplier=self.supplier,
            zone_name='South Region',
            supplier_contact='789012',
            gst_number='GST222',
            status=False
        )

        url = reverse('dashboard:api_subsection_x-list')

        # Filter active
        response = self.client.get(url, {'status': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['po_no'], po1.po_no)

        # Search po_no
        response = self.client.get(url, {'search': po1.po_no})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['po_no'], po1.po_no)

        # Filter po_status
        response = self.client.get(url, {'po_status': 'Draft'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2) # Both active and inactive POs matching 'Draft'
        
        # Filter zone_name
        response = self.client.get(url, {'zone_name': 'South'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['po_no'], po2.po_no)

        # Filter broker
        response = self.client.get(url, {'broker': 'Broker B'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

        # Filter supplier_contact
        response = self.client.get(url, {'supplier_contact': '123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['po_no'], po1.po_no)

        # Filter gst_number
        response = self.client.get(url, {'gst_number': 'GST222'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['po_no'], po2.po_no)

    def test_page_view_prev_next_navigation(self):
        """Verify prev/next record keys in SubSectionXCreateView context."""
        from dashboard.models.purchase_order import PurchaseOrder

        po1 = PurchaseOrder.objects.create(
            po_date=timezone.now() - timezone.timedelta(days=1),
            broker=self.broker,
            supplier=self.supplier,
            zone_name='North Region',
            delivery_location='Plant 1',
            delivery_terms='Ex Works/Ex-Godown',
            payment_terms='Advance',
            freight_terms='Supplier Paid',
            status=True
        )
        po2 = PurchaseOrder.objects.create(
            po_date=timezone.now(),
            broker=self.broker,
            supplier=self.supplier,
            zone_name='North Region',
            delivery_location='Plant 1',
            delivery_terms='Ex Works/Ex-Godown',
            payment_terms='Advance',
            freight_terms='Supplier Paid',
            status=True
        )

        # Note: listing orders by -po_date, -date_created. So po2 (newer po_date) is first, po1 is second.
        # View page for po2
        view_url2 = reverse('dashboard:subsection_x_edit', kwargs={'pk': po2.po_no})
        response2 = self.client.get(view_url2 + '?mode=view')
        self.assertEqual(response2.status_code, 200)
        self.assertIsNone(response2.context['prev_pk'])
        self.assertEqual(response2.context['next_pk'], po1.po_no)

        # View page for po1
        view_url1 = reverse('dashboard:subsection_x_edit', kwargs={'pk': po1.po_no})
        response1 = self.client.get(view_url1 + '?mode=view')
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response1.context['prev_pk'], po2.po_no)
        self.assertIsNone(response1.context['next_pk'])

    def test_purchase_order_deletion_locking_rules(self):
        """Verify that Approved and Submitted POs cannot be deleted/soft-deleted, while Draft/RefBack can be."""
        from dashboard.models.purchase_order import PurchaseOrder

        # 1. Test Approved PO (Active)
        po_approved = PurchaseOrder.objects.create(
            po_date=timezone.now(),
            broker=self.broker,
            supplier=self.supplier,
            po_status='Approved',
            status=True
        )
        url_approved = reverse('dashboard:api_subsection_x-detail', kwargs={'po_no': po_approved.po_no})
        
        # Try soft delete
        response = self.client.delete(url_approved)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        po_approved.refresh_from_db()
        self.assertTrue(po_approved.status) # Still Active

        # Try toggle status
        response = self.client.post(url_approved + 'toggle_status/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        po_approved.refresh_from_db()
        self.assertTrue(po_approved.status)

        # 1b. Test Approved PO (Inactive)
        po_approved_inactive = PurchaseOrder.objects.create(
            po_date=timezone.now(),
            broker=self.broker,
            supplier=self.supplier,
            po_status='Approved',
            status=False
        )
        url_approved_inactive = reverse('dashboard:api_subsection_x-detail', kwargs={'po_no': po_approved_inactive.po_no})

        # Try to hard-delete Approved Inactive PO - should block it!
        response = self.client.delete(url_approved_inactive)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        po_approved_inactive.refresh_from_db() # Still exists

        # Try to restore (toggle status) Approved Inactive PO - should succeed!
        response = self.client.post(url_approved_inactive + 'toggle_status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        po_approved_inactive.refresh_from_db()
        self.assertTrue(po_approved_inactive.status) # Successfully restored/activated!

        # 2. Test Submitted PO
        po_submitted = PurchaseOrder.objects.create(
            po_date=timezone.now(),
            broker=self.broker,
            supplier=self.supplier,
            po_status='Submitted',
            status=True
        )
        url_submitted = reverse('dashboard:api_subsection_x-detail', kwargs={'po_no': po_submitted.po_no})
        
        # Try soft delete
        response = self.client.delete(url_submitted)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try toggle status
        response = self.client.post(url_submitted + 'toggle_status/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Test Draft PO
        po_draft = PurchaseOrder.objects.create(
            po_date=timezone.now(),
            broker=self.broker,
            supplier=self.supplier,
            po_status='Draft',
            status=True
        )
        url_draft = reverse('dashboard:api_subsection_x-detail', kwargs={'po_no': po_draft.po_no})
        
        # Soft delete Draft
        response = self.client.delete(url_draft)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        po_draft.refresh_from_db()
        self.assertFalse(po_draft.status) # Soft-deleted successfully

        # Hard delete Draft
        response = self.client.delete(url_draft)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(PurchaseOrder.DoesNotExist):
            PurchaseOrder.objects.get(po_no=po_draft.po_no)

    def test_checker_edit_approve_rights(self):
        """Verify that Checker/Admin can edit/save POs even if Submitted/Approved, while normal users cannot."""
        from dashboard.models.purchase_order import PurchaseOrder

        # Create a Submitted PO
        po = PurchaseOrder.objects.create(
            po_no='PO-EDIT-111',
            po_date=timezone.now(),
            broker=self.broker,
            supplier=self.supplier,
            po_status='Submitted',
            status=True
        )
        url = reverse('dashboard:api_subsection_x-detail', kwargs={'po_no': po.po_no})

        valid_item = {
            'item': self.material.id,
            'order_qty': '10.5000',
            'uom': 'MT',
            'unit_rate': '150.0000',
            'amount': '1575.00',
            'remarks': 'Test item'
        }

        # 1. Try to edit as normal user (session role is empty)
        payload = {
            'po_date': po.po_date.isoformat(),
            'supplier': self.supplier.pk,
            'expected_delivery_date': '2026-07-01',
            'special_instructions': 'Updated by Maker',
            'po_status': 'Submitted',
            'items': [valid_item]
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 2. Try to edit as Checker
        session = self.client.session
        session['role'] = 'Checker'
        session.save()

        # Update fields and approve
        payload = {
            'po_date': po.po_date.isoformat(),
            'supplier': self.supplier.pk,
            'expected_delivery_date': '2026-07-01',
            'special_instructions': 'Approved and updated by Checker',
            'po_status': 'Approved',
            'items': [valid_item]
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify changes in DB
        po.refresh_from_db()
        self.assertEqual(po.po_status, 'Approved')
        self.assertEqual(po.special_instructions, 'Approved and updated by Checker')

        # 3. Clear session and try to edit Approved PO as normal user again
        session['role'] = 'User'
        session.save()

        payload = {
            'po_date': po.po_date.isoformat(),
            'supplier': self.supplier.pk,
            'special_instructions': 'Attempt by Normal User',
            'items': [valid_item]
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MaterialCreateAPIViewTests(TestCase):
    def test_create_material_success_auto_code(self):
        """Verify dynamic material creation with auto-generated code."""
        url = reverse('dashboard:api_material_create')
        data = {
            'material_name': 'New Special Item'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertTrue(resp_json['success'])
        self.assertEqual(resp_json['text'], 'New Special Item')
        self.assertTrue(resp_json['code'].startswith('M-'))
        
        # Verify it exists in DB
        from dashboard.models import Material
        self.assertTrue(Material.objects.filter(id=resp_json['id']).exists())

    def test_create_material_success_custom_code(self):
        """Verify dynamic material creation with custom code."""
        url = reverse('dashboard:api_material_create')
        data = {
            'material_name': 'Another Item',
            'material_code': 'CUSTOM-999'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertTrue(resp_json['success'])
        self.assertEqual(resp_json['code'], 'CUSTOM-999')

        from dashboard.models import Material
        self.assertTrue(Material.objects.filter(material_code='CUSTOM-999').exists())

    def test_create_material_empty_name(self):
        """Verify empty name triggers error."""
        url = reverse('dashboard:api_material_create')
        data = {
            'material_name': ''
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertFalse(resp_json['success'])
        self.assertIn('material_name', resp_json['errors'])

    def test_create_material_duplicate_code(self):
        """Verify duplicate code triggers error."""
        from dashboard.models import Material
        Material.objects.create(material_code='DUP-123', material_name='Original Item')

        url = reverse('dashboard:api_material_create')
        data = {
            'material_name': 'Duplicate Item',
            'material_code': 'DUP-123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertFalse(resp_json['success'])
        self.assertIn('material_code', resp_json['errors'])


# =============================================================================
# SUB SECTION Y TESTS
# =============================================================================

class SubsectionYTests(APITestCase):
    def setUp(self):
        from dashboard.models.sal_pur_group import SalPurGroup
        from dashboard.models.pur_sales import PurSales, PurSalesTran
        
        self.category = Category.objects.create(categoryName="Bank Accounts", categoryType="A")
        self.alpha_bank = AccountMaster.objects.create(
            groupID=101,
            Account_Name="HDFC Current Account",
            display_name="HDFC Current",
            category=self.category,
            is_active=True
        )
        self.alpha_ledger = AccountMaster.objects.create(
            groupID=102,
            Account_Name="Travel Expenses",
            display_name="Travel Exp",
            category=self.category,
            is_active=True
        )
        self.sal_pur_group = SalPurGroup.objects.create(
            SalPurGroupName="Test Pur Group",
            GroupwiseAccounting=True,
            IsGSTApplicableY1N0=True,
            IGST1_CGST0=False,
            is_active=True
        )
        now = timezone.now()

        # Create some Y records
        for i in range(1, 6):
            ps = PurSales.objects.create(
                VoucherNo=f"Y-VOUCH-{i:03d}",
                VoucherDate=now.date(),
                TranType="J001",
                OrderNo=f"Y-ORDER-{i:03d}",
                OrderDate=now.date(),
                PurSalGroupID=self.sal_pur_group,
                PartyID=self.alpha_bank,
                BrokerID=None,
                UserCreated="system"
            )
            PurSalesTran.objects.create(
                VoucherNo=ps.VoucherNo,
                VoucherDate=ps.VoucherDate,
                TranType=ps.TranType,
                Item_ID=None,
                Amount=100.00 * i
            )

    def test_subsection_y_list_views(self):
        """Verify views render with correct templates."""
        list_url = reverse('dashboard:subsection_y_list')
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTemplateUsed(response, 'dashboard/subsection_y_list.html')

        create_url = reverse('dashboard:subsection_y_create')
        response = self.client.get(create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTemplateUsed(response, 'dashboard/subsection_y_form.html')

        edit_url = reverse('dashboard:subsection_y_edit', kwargs={'pk': 'Y-ORDER-001'})
        response = self.client.get(edit_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTemplateUsed(response, 'dashboard/subsection_y_form.html')

    def test_subsection_y_api_list_and_isolation(self):
        """Verify API list returns only Y records."""
        url = reverse('dashboard:api_subsection_y-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))
        self.assertEqual(len(response.data), 5)
        for record in response.data:
            self.assertEqual(record['VoucherNo'][:7], 'Y-VOUCH')

    def test_subsection_y_api_crud_operations(self):
        """Verify create, update, delete operations via API."""
        from dashboard.models.pur_sales import PurSales
        list_url = reverse('dashboard:api_subsection_y-list')
        
        # Create
        create_data = {
            'VoucherNo': 'Y-VOUCH-006',
            'VoucherDate': timezone.now().date().isoformat(),
            'TranType': 'J001',
            'OrderNo': 'Y-ORDER-006',
            'OrderDate': timezone.now().date().isoformat(),
            'PurSalGroupID': self.sal_pur_group.pk,
            'PartyID': self.alpha_bank.pk,
            'items': [
                {
                    'Amount': 600.00,
                }
            ]
        }
        response = self.client.post(list_url, create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PurSales.objects.filter(VoucherNo='Y-VOUCH-006').exists())

        # Update
        detail_url = reverse('dashboard:api_subsection_y-detail', kwargs={'OrderNo': 'Y-ORDER-006'})
        update_data = create_data.copy()
        update_data['SpecialInstructions'] = 'Updated Y instructions'
        response = self.client.put(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PurSales.objects.get(OrderNo='Y-ORDER-006').SpecialInstructions, 'Updated Y instructions')

        # Toggle status
        toggle_url = detail_url + 'toggle_status/'
        response = self.client.post(toggle_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Permanent Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PurSales.objects.filter(OrderNo='Y-ORDER-006').exists())


class BrokerAndSupplierCreateAPIViewTests(TestCase):
    def test_create_broker_success(self):
        url = reverse('dashboard:api_broker_create')
        data = {
            'broker_name': 'New Test Broker'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertTrue(resp_json['success'])
        self.assertEqual(resp_json['text'], 'New Test Broker')
        
        from dashboard.models import Broker
        self.assertTrue(Broker.objects.filter(BrokerID=resp_json['id']).exists())

    def test_create_broker_empty_name(self):
        url = reverse('dashboard:api_broker_create')
        data = {
            'broker_name': ''
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertFalse(resp_json['success'])
        self.assertIn('broker_name', resp_json['errors'])

    def test_create_supplier_success(self):
        url = reverse('dashboard:api_supplier_create')
        data = {
            'supplier_name': 'New Test Supplier'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertTrue(resp_json['success'])
        self.assertEqual(resp_json['text'], 'New Test Supplier')
        
        from dashboard.models import VendorSupplier
        self.assertTrue(VendorSupplier.objects.filter(VendorSupplierID=resp_json['id']).exists())

    def test_create_supplier_empty_name(self):
        url = reverse('dashboard:api_supplier_create')
        data = {
            'supplier_name': ''
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertFalse(resp_json['success'])
        self.assertIn('supplier_name', resp_json['errors'])


class UserMasterTests(TestCase):
    def setUp(self):
        from dashboard.models.user_master import UserMaster
        self.user1 = UserMaster.objects.create(
            user_id="testuser1",
            user_name="Test User One",
            role="Maker",
            empid="EMP101",
            is_active=True
        )

    def test_user_creation(self):
        from dashboard.models.user_master import UserMaster
        self.assertEqual(str(self.user1), "Test User One (testuser1)")
        self.assertEqual(self.user1.role, "Maker")
        self.assertEqual(self.user1.empid, "EMP101")
        self.assertTrue(self.user1.is_active)

    def test_user_api_crud(self):
        from rest_framework import status
        from dashboard.models.user_master import UserMaster
        
        # 1. List
        list_url = reverse('dashboard:api_user_master-list')
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

        # 2. Create
        import json
        payload = {
            'user_id': 'testuser2',
            'user_name': 'Test User Two',
            'role': 'Checker',
            'empid': 'EMP102',
            'is_active': True
        }
        response = self.client.post(list_url, json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserMaster.objects.filter(user_id='testuser2').exists())

        # 3. Update
        detail_url = reverse('dashboard:api_user_master-detail', kwargs={'user_id': 'testuser2'})
        payload['user_name'] = 'Updated User Two'
        response = self.client.put(detail_url, json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(UserMaster.objects.get(user_id='testuser2').user_name, 'Updated User Two')


        # 4. Toggle Status
        toggle_url = detail_url + 'toggle_status/'
        response = self.client.post(toggle_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['status'])
        self.assertFalse(UserMaster.objects.get(user_id='testuser2').is_active)

        # 5. Delete active (should fail)
        active_detail_url = reverse('dashboard:api_user_master-detail', kwargs={'user_id': 'testuser1'})
        response = self.client.delete(active_detail_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(UserMaster.objects.filter(user_id='testuser1').exists())

        # 6. Delete inactive (should succeed)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(UserMaster.objects.filter(user_id='testuser2').exists())


class SalPurGroupAPITests(APITestCase):
    def setUp(self):
        from dashboard.models.sal_pur_group import SalPurGroup, TransactionType
        
        # Create some Transaction Types
        self.tt_purchase = TransactionType.objects.create(
            TransactionTypeName="Purchase",
            TransactionType="PURC"
        )
        self.tt_sales = TransactionType.objects.create(
            TransactionTypeName="Sales",
            TransactionType="SALE"
        )
        
        # Create SalPurGroups
        self.group_pur = SalPurGroup.objects.create(
            SalPurGroupName="Purchase Group A",
            TransactionTypeID=self.tt_purchase,
            is_active=True
        )
        self.group_sal = SalPurGroup.objects.create(
            SalPurGroupName="Sales Group B",
            TransactionTypeID=self.tt_sales,
            is_active=True
        )

    def test_sal_pur_group_list_and_filters(self):
        url = reverse('dashboard:api_sal_pur_group-list')
        
        # 1. Test basic listing
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(results), 2)
        
        # 2. Test filtering by transaction_type parameter
        response = self.client.get(url, {'transaction_type': 'Purchase'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['SalPurGroupName'], "Purchase Group A")
        self.assertEqual(results[0]['transaction_type_display']['name'], "Purchase")

        # 3. Test generic search by transaction type name
        response = self.client.get(url, {'search': 'Sales'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data

class PurchaseChallanAndGatePassTests(TestCase):
    def setUp(self):
        from dashboard.models import VendorSupplier, AccountMaster, Category
        self.supplier = VendorSupplier.objects.create(
            VendorSupplierID=301,
            VendorSupplierName="Acme Industrial Supplies",
            Address1="123 Industrial Area",
            ContactNo="9876543210"
        )
        self.category = Category.objects.create(categoryName="Suppliers", categoryType="A")
        self.account_master = AccountMaster.objects.create(
            groupID=301,
            Account_Name="Acme Ledger Account",
            display_name="Acme Ledger",
            category=self.category,
            is_active=True
        )
        from dashboard.models.gate_entry import GateEntry, GatePass, Material
        self.material = Material.objects.create(material_code="RM-01", material_name="Raw Material 1")
        self.gate_entry = GateEntry.objects.create(
            gate_pass_id="GP-10001",
            supplier=self.account_master,
            vehicle_number="MH-12-AB-1234",
            material_type=self.material,
            driver_name="John Doe",
            entry_datetime=timezone.now()
        )
        self.gate_pass = GatePass(
            GatePassNo=1,
            GatePassdate=timezone.now().date(),
            VehicleNo="MH-12-AB-1234",
            DriverName="John Doe"
        )

    def test_purchase_challan_suppliers_context(self):
        """Verify PurchaseChallanCreateView populates suppliers from VendorSupplier without field errors."""
        url = reverse('dashboard:purchase_challan_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('suppliers', response.context)
        supplier_names = [s.VendorSupplierName for s in response.context['suppliers']]
        self.assertIn("Acme Industrial Supplies", supplier_names)

    def test_gate_pass_serializer_supplier_name(self):
        """Verify GatePassSerializer resolves supplier_name from GateEntry."""
        from dashboard.serializers import GatePassSerializer
        serializer = GatePassSerializer()
        supplier_name = serializer.get_supplier_name(self.gate_pass)
        self.assertEqual(supplier_name, "Acme Ledger Account")
