from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from api.models import (
    Product, RawMaterialPurchase, Production, Sale, Expense, 
    ActivityLog, Notification
)

class Command(BaseCommand):
    help = 'Seeds the database with exactly ONE dummy record per module'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing data and seeding exactly 1 dummy record per table...')

        RawMaterialPurchase.objects.all().delete()
        Production.objects.all().delete()
        Sale.objects.all().delete()
        Expense.objects.all().delete()
        Product.objects.all().delete()
        ActivityLog.objects.all().delete()
        Notification.objects.all().delete()

        today = timezone.now().date()

        # 1 Product
        p = Product.objects.create(
            name='Dummy Paver Block',
            category='Standard',
            color='Red',
            description='This is a dummy product for testing.',
            low_stock_threshold=500
        )
        self.stdout.write(f"Created Product: {p}")

        # 1 Raw Material Purchase
        rm = RawMaterialPurchase.objects.create(
            purchase_date=today,
            material_name='Dummy Cement',
            quantity=100,
            unit='Bags',
            purchase_amount=35000.00,
            supplier_name='Dummy Supplier',
            notes='Initial dummy purchase'
        )
        
        # 1 Production
        pr = Production.objects.create(
            production_date=today,
            product=p,
            quantity=1000
        )

        # 1 Sale
        s = Sale.objects.create(
            sale_date=today,
            product=p,
            quantity=200,
            sale_amount=15000.00,
            customer_name='Dummy Customer'
        )

        # 1 Expense
        e = Expense.objects.create(
            expense_date=today,
            category='Dummy Expense',
            amount=5000.00,
            description='Initial dummy expense'
        )

        ActivityLog.objects.create(action='Database Initialized', details='One dummy record created per module.')
        Notification.objects.create(type='SYSTEM', message="Dummy data successfully initialized.", is_read=False)

        self.stdout.write(self.style.SUCCESS('Successfully seeded exactly 1 dummy record per table!'))
