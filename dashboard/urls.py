from django.urls import path
from .views import (
    AccountMasterListView,
    AccountMasterCreateView,
    AccountMasterUpdateView,
    AccountMasterToggleStatusView,
    AccountMasterToggleStatusView,
    AccountMasterDeleteView,
    VoucherListView,
    VoucherCreateView,
    VoucherUpdateView,
    VoucherToggleStatusView,
    VoucherDeleteView,
    AccountMasterGroupSearchView,
    AccountMasterGroupDetailView,
    ExportVoucherView,
    ImportVoucherView,
    BankTransactionListView,
    BankTransactionCreateView,
    SectionCListView,
    SectionCCreateView,
    GateEntryView,
    GateEntryPrintView,
    SubSectionXListView,
    SubSectionXCreateView,
    MaterialCreateAPIView,
    BrokerCreateAPIView,
    VendorSupplierCreateAPIView,
    SubSectionYListView,
    SubSectionYCreateView,
    SalPurGroupListView,
    SalPurGroupCreateView,
    UserMasterListView,
    UserMasterCreateView,
    LoginView,
    LogoutView
)
from rest_framework.routers import DefaultRouter
from .api_views import (
    CashBankViewSet,
    SectionCViewSet,
    SubsectionB2ViewSet,
    PurchaseOrderViewSet,
    SubsectionYViewSet,
    SalPurGroupViewSet,
    UserMasterViewSet,
    TransactionTypeViewSet
)

router = DefaultRouter()
router.register(r'api/bank-transactions', CashBankViewSet, basename='api_bank_transaction')
router.register(r'api/section-c', SectionCViewSet, basename='api_section_c')
router.register(r'api/subsection-b2', SubsectionB2ViewSet, basename='api_subsection_b2')
router.register(r'api/subsection-x', PurchaseOrderViewSet, basename='api_subsection_x')
router.register(r'api/subsection-y', SubsectionYViewSet, basename='api_subsection_y') # Aliased for cached clients
router.register(r'api/sal-pur-group', SalPurGroupViewSet, basename='api_sal_pur_group')
router.register(r'api/user-master', UserMasterViewSet, basename='api_user_master')
router.register(r'api/transaction-type', TransactionTypeViewSet, basename='api_transaction_type')

app_name = 'dashboard'

urlpatterns = [
    # Clean REST-like URLs for AccountMaster
    path('account_master/', AccountMasterListView.as_view(), name='alpha_list'),
    path('account_master/create/', AccountMasterCreateView.as_view(), name='alpha_create'),
    path('account_master/<int:pk>/edit/', AccountMasterUpdateView.as_view(), name='alpha_edit'),
    path('account_master/<int:pk>/toggle/', AccountMasterToggleStatusView.as_view(), name='alpha_toggle'),
    path('account_master/<int:pk>/delete/', AccountMasterDeleteView.as_view(), name='alpha_delete'),

    # Voucher URLs
    path('voucher/', VoucherListView.as_view(), name='voucher_list'),
    path('voucher/create/', VoucherCreateView.as_view(), name='voucher_create'),
    path('voucher/<path:pk>/edit/', VoucherUpdateView.as_view(), name='voucher_edit'),
    path('voucher/<path:pk>/toggle/', VoucherToggleStatusView.as_view(), name='voucher_toggle'),
    path('voucher/<path:pk>/delete/', VoucherDeleteView.as_view(), name='voucher_delete'),
    path('voucher/export/', ExportVoucherView.as_view(), name='voucher_export'),
    path('voucher/import/', ImportVoucherView.as_view(), name='voucher_import'),
    
    # Bank Transaction URLs
    path('bank-transaction/', BankTransactionListView.as_view(), name='bank_transaction_list'),
    path('bank-transaction/create/', BankTransactionCreateView.as_view(), name='bank_transaction_create'),
    path('bank-transaction/<path:pk>/edit/', BankTransactionCreateView.as_view(), name='bank_transaction_edit'),
    
    # Section C URLs
    path('section-c/', SectionCListView.as_view(), name='section_c_list'),
    path('section-c/create/', SectionCCreateView.as_view(), name='section_c_create'),
    path('section-c/<path:pk>/edit/', SectionCCreateView.as_view(), name='section_c_edit'),
    
    # API URLs
    path('api/accountmaster-search/', AccountMasterGroupSearchView.as_view(), name='api_alpha_search'),
    path('api/account_master/<int:pk>/', AccountMasterGroupDetailView.as_view(), name='api_alpha_detail'),


    # Sub Section X (Purchase Order) URLs
    path('subsection-x/', SubSectionXListView.as_view(), name='subsection_x_list'),
    path('subsection-x/create/', SubSectionXCreateView.as_view(), name='subsection_x_create'),
    path('subsection-x/<path:pk>/edit/', SubSectionXCreateView.as_view(), name='subsection_x_edit'),
    path('api/material-create/', MaterialCreateAPIView.as_view(), name='api_material_create'),
    path('api/broker-create/', BrokerCreateAPIView.as_view(), name='api_broker_create'),
    path('api/supplier-create/', VendorSupplierCreateAPIView.as_view(), name='api_supplier_create'),

    # Sub Section Y URLs
    path('subsection-y/', SubSectionYListView.as_view(), name='subsection_y_list'),
    path('subsection-y/create/', SubSectionYCreateView.as_view(), name='subsection_y_create'),
    path('subsection-y/<path:pk>/edit/', SubSectionYCreateView.as_view(), name='subsection_y_edit'),

    # Gate Entry URLs
    path('settings/gate-entry/', GateEntryView.as_view(), name='gate_entry'),
    path('settings/gate-entry/<int:pk>/print/', GateEntryPrintView.as_view(), name='gate_entry_print'),

    # Sales/Purchase Group URLs
    path('sal-pur-group/', SalPurGroupListView.as_view(), name='sal_pur_group_list'),
    path('sal-pur-group/create/', SalPurGroupCreateView.as_view(), name='sal_pur_group_create'),
    path('sal-pur-group/<path:pk>/edit/', SalPurGroupCreateView.as_view(), name='sal_pur_group_edit'),

    # User Master URLs
    path('settings/user-master/', UserMasterListView.as_view(), name='user_master_list'),
    path('settings/user-master/create/', UserMasterCreateView.as_view(), name='user_master_create'),
    path('settings/user-master/<path:pk>/edit/', UserMasterCreateView.as_view(), name='user_master_edit'),

    # Auth URLs
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
] + router.urls
