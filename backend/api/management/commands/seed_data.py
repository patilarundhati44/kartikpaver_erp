from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from api.models import (
    Product, RawMaterialPurchase, Production, Sale, Expense, 
    ActivityLog, Notification
)


class Command(BaseCommand):
    help = 'Seeds the database with default paver block products and sample ERP transactions'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database with sample data...')

        # 1. Create Products
        products_data = [
            {'name': 'Zigzag Paver Block', 'category': 'Standard', 'color': 'Red', 'low_stock_threshold': 800},
            {'name': 'Zigzag Paver Block', 'category': 'Standard', 'color': 'Grey', 'low_stock_threshold': 500},
            {'name': 'Rectangular Paver Block', 'category': 'Standard', 'color': 'Red', 'low_stock_threshold': 600},
            {'name': 'Rectangular Paver Block', 'category': 'Standard', 'color': 'Grey', 'low_stock_threshold': 500},
            {'name': 'I Shape Paver Block', 'category': 'Decorative', 'color': 'Yellow', 'low_stock_threshold': 600},
            {'name': 'I Shape Paver Block', 'category': 'Decorative', 'color': 'Grey', 'low_stock_threshold': 500},
            {'name': 'Kerb Stone', 'category': 'Boundary', 'color': 'Natural', 'low_stock_threshold': 200},
            {'name': 'Kerb Stone', 'category': 'Boundary', 'color': 'Grey', 'low_stock_threshold': 150},
        ]

        products = {}
        for item in products_data:
            p, created = Product.objects.get_or_create(
                name=item['name'],
                color=item['color'],
                defaults={
                    'category': item['category'],
                    'low_stock_threshold': item['low_stock_threshold'],
                    'description': f"{item['color']} colored {item['name']} manufactured with high density compression."
                }
            )
            products[f"{item['color']}_{item['name']}"] = p
            if created:
                self.stdout.write(f"Created Product: {p}")

        # Clear existing transactions to allow clean re-runs
        RawMaterialPurchase.objects.all().delete()
        Production.objects.all().delete()
        Sale.objects.all().delete()
        Expense.objects.all().delete()
        ActivityLog.objects.all().delete()
        Notification.objects.all().delete()

        # Dates references relative to current day
        today = date(2026, 6, 17) # Matching target context date: June 17, 2026
        d1 = today - timedelta(days=1)
        d2 = today - timedelta(days=2)
        d3 = today - timedelta(days=3)
        d4 = today - timedelta(days=4)
        d5 = today - timedelta(days=5)

        # 2. Seed Raw Material Purchases
        purchases = [
            RawMaterialPurchase(purchase_date=d5, material_name='Cement', quantity=150, unit='Bags', purchase_amount=60000.00, supplier_name='UltraTech Cement', notes='Grade 53 OPC Cement'),
            RawMaterialPurchase(purchase_date=d4, material_name='Sand', quantity=5, unit='Brass', purchase_amount=30000.00, supplier_name='Local Riverbed Supplier', notes='Fine quality river sand'),
            RawMaterialPurchase(purchase_date=d3, material_name='Aggregate', quantity=4, unit='Brass', purchase_amount=24000.00, supplier_name='Stone Crusher MIDC', notes='10mm size aggregate'),
            RawMaterialPurchase(purchase_date=d2, material_name='Color Powder', quantity=100, unit='Kg', purchase_amount=15000.00, supplier_name='Kores Dyes & Pigments', notes='Red & Yellow oxide powder'),
            RawMaterialPurchase(purchase_date=d1, material_name='Fly Ash', quantity=20, unit='Tons', purchase_amount=32000.00, supplier_name='NTPC Ash Yard', notes='Class F dry fly ash'),
            RawMaterialPurchase(purchase_date=today, material_name='Cement', quantity=50, unit='Bags', purchase_amount=20000.00, supplier_name='Ambuja Cement', notes='Urgent batch requirement'),
        ]
        RawMaterialPurchase.objects.bulk_create(purchases)
        self.stdout.write(f"Seeded {len(purchases)} Raw Material Purchases.")

        # 3. Seed Production Records
        productions = [
            # 5 days ago
            Production(production_date=d5, product=products['Red_Zigzag Paver Block'], quantity=1200),
            Production(production_date=d5, product=products['Grey_Zigzag Paver Block'], quantity=1000),
            # 4 days ago
            Production(production_date=d4, product=products['Red_Rectangular Paver Block'], quantity=1500),
            Production(production_date=d4, product=products['Grey_Rectangular Paver Block'], quantity=1200),
            # 3 days ago
            Production(production_date=d3, product=products['Yellow_I Shape Paver Block'], quantity=1000),
            Production(production_date=d3, product=products['Grey_I Shape Paver Block'], quantity=900),
            # 2 days ago
            Production(production_date=d2, product=products['Natural_Kerb Stone'], quantity=300),
            Production(production_date=d2, product=products['Grey_Kerb Stone'], quantity=200),
            # 1 day ago
            Production(production_date=d1, product=products['Red_Zigzag Paver Block'], quantity=1500),
            Production(production_date=d1, product=products['Yellow_I Shape Paver Block'], quantity=1000),
            # Today (June 17, 2026)
            Production(production_date=today, product=products['Grey_Zigzag Paver Block'], quantity=1400),
            Production(production_date=today, product=products['Red_Rectangular Paver Block'], quantity=800),
        ]
        Production.objects.bulk_create(productions)
        self.stdout.write(f"Seeded {len(productions)} Production entries.")

        # 4. Seed Sales Records
        sales = [
            # 4 days ago
            Sale(sale_date=d4, product=products['Red_Zigzag Paver Block'], quantity=400, sale_amount=24000.00, customer_name='Rohan Builders Latur'),
            Sale(sale_date=d4, product=products['Grey_Zigzag Paver Block'], quantity=300, sale_amount=16500.00, customer_name='Rohan Builders Latur'),
            # 3 days ago
            Sale(sale_date=d3, product=products['Red_Rectangular Paver Block'], quantity=500, sale_amount=30000.00, customer_name='MIDC Road Contractor'),
            # 2 days ago
            Sale(sale_date=d2, product=products['Yellow_I Shape Paver Block'], quantity=600, sale_amount=39000.00, customer_name='Siddheshwar Developers'),
            Sale(sale_date=d2, product=products['Grey_I Shape Paver Block'], quantity=400, sale_amount=24000.00, customer_name='Walk-in customer'),
            # 1 day ago
            Sale(sale_date=d1, product=products['Natural_Kerb Stone'], quantity=100, sale_amount=15000.00, customer_name='Latur Municipal Corporation'),
            # Today (June 17, 2026)
            Sale(sale_date=today, product=products['Red_Zigzag Paver Block'], quantity=500, sale_amount=30000.00, customer_name='Bhakti Infrastructure'),
            Sale(sale_date=today, product=products['Yellow_I Shape Paver Block'], quantity=300, sale_amount=19500.00, customer_name='Bhakti Infrastructure'),
        ]
        Sale.objects.bulk_create(sales)
        self.stdout.write(f"Seeded {len(sales)} Sales entries.")

        # 5. Seed Operating Expenses
        expenses = [
            Expense(expense_date=d5, category='Labour', amount=12000.00, description='Weekly factory labour charges'),
            Expense(expense_date=d4, category='Diesel', amount=4500.00, description='Diesel for loaders and transport mixer'),
            Expense(expense_date=d3, category='Maintenance', amount=7500.00, description='Paver block machine vibrator motor repair'),
            Expense(expense_date=d2, category='Transportation', amount=5000.00, description='Sand shipping transportation charges'),
            Expense(expense_date=d1, category='Labour', amount=3500.00, description='Extra loading labour wages'),
            Expense(expense_date=today, category='Electricity', amount=18000.00, description='Factory monthly electricity bill'),
            Expense(expense_date=today, category='Miscellaneous', amount=1200.00, description='Daily tea and snacks for office staff'),
        ]
        Expense.objects.bulk_create(expenses)
        self.stdout.write(f"Seeded {len(expenses)} Expense records.")

        # 6. Create logs and notifications
        ActivityLog.objects.create(action='Database Seeded', details='Database populated with sample products and transactions for testing.')
        
        # Check low stock products and create alerts
        # (Kerb stone stock: Grey Kerb Stone produced 200, sold 0, remaining 200, threshold 150 -> Ok. Natural Kerb Stone produced 300, sold 100, remaining 200, threshold 200 -> Alerts!)
        # Grey_Kerb Stone: prod 200, sold 0, stock 200, threshold 150 -> Ok.
        # Grey_I Shape: prod 900, sold 400, stock 500, threshold 500 -> Low stock threshold (since stock == 500, threshold is 500, we trigger if < 500)
        # Let's create an initial notification to show it works
        Notification.objects.create(
            type='LOW_STOCK',
            message="Low Stock Alert: Grey Kerb Stone stock is at 200 units (threshold 150).",
            is_read=False
        )
        Notification.objects.create(
            type='LOW_STOCK',
            message="Low Stock Alert: Red Rectangular Paver Block is at 300 units (threshold 600).",
            is_read=False
        )

        self.stdout.write(self.style.SUCCESS('Database successfully seeded with sample data.'))
