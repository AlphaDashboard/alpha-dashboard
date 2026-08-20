with open('e:/Alpha Dashboard 14 may/Alpha Dashboard 14 may/Alpha Dashboard/dashboard/api_views.py', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'PurchaseOrderViewSet' in line:
            print(f"Line {i+1}: {line.strip()}")
