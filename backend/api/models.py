from django.db import models
from django.contrib.auth.models import User
from django.db.models import Sum, F, Subquery, OuterRef
from django.db.models.functions import Coalesce


class ProductQuerySet(models.QuerySet):
    def with_stock(self):
        """
        Efficiently annotates the queryset with total produced, total sold,
        and current stock using subqueries to avoid duplicate join records.
        """
        # Subquery for total produced
        prod_sub = Production.objects.filter(
            product=OuterRef('pk')
        ).values('product').annotate(
            total=Sum('quantity')
        ).values('total')

        # Subquery for total sold
        sales_sub = SaleItem.objects.filter(
            product=OuterRef('pk')
        ).values('product').annotate(
            total=Sum('quantity')
        ).values('total')

        return self.annotate(
            total_produced=Coalesce(Subquery(prod_sub), 0),
            total_sold=Coalesce(Subquery(sales_sub), 0)
        ).annotate(
            current_stock=F('total_produced') - F('total_sold')
        )


class ProductManager(models.Manager):
    def get_queryset(self):
        return ProductQuerySet(self.model, using=self._db)

    def with_stock(self):
        return self.get_queryset().with_stock()


class Product(models.Model):
    """
    Product Model representing a Paver Block Type + Color combination.
    E.g. Name: "Zigzag Paver Block", Color: "Red".
    """
    name = models.CharField(max_length=150, help_text="e.g. Zigzag Paver Block")
    category = models.CharField(max_length=100, help_text="e.g. Standard, Decorative, Kerb Stone")
    color = models.CharField(max_length=50, help_text="e.g. Red, Grey, Yellow, Natural")
    description = models.TextField(blank=True, null=True)
    low_stock_threshold = models.IntegerField(default=500, help_text="Alert trigger when stock drops below this limit")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProductManager()

    class Meta:
        ordering = ['name', 'color']
        unique_together = ('name', 'color')  # Unique combination of type + color

    def __str__(self):
        return f"{self.color} {self.name}"

    @property
    def current_stock_value(self):
        """Dynamic single-object stock calculation."""
        produced = Production.objects.filter(product=self).aggregate(total=Coalesce(Sum('quantity'), 0))['total']
        sold = SaleItem.objects.filter(product=self).aggregate(total=Coalesce(Sum('quantity'), 0))['total']
        return produced - sold

    @property
    def is_low_stock(self):
        return self.current_stock_value < self.low_stock_threshold


class RawMaterialPurchase(models.Model):
    """
    Records raw material purchases (Cement, Sand, Aggregate, Color Powder, Fly Ash, etc.)
    """
    purchase_date = models.DateField()
    material_name = models.CharField(max_length=150, help_text="e.g. Cement, Sand, Fly Ash")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, help_text="Quantity purchased")
    unit = models.CharField(max_length=50, help_text="e.g. Bags, Tons, Brass, Kg")
    purchase_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total price in INR")
    supplier_name = models.CharField(max_length=150, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-purchase_date', '-created_at']

    def __str__(self):
        return f"{self.material_name} - {self.quantity} {self.unit} ({self.purchase_date})"


class Production(models.Model):
    """
    Daily production records for finished products.
    """
    production_date = models.DateField()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='productions')
    quantity = models.IntegerField(help_text="Quantity produced")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-production_date', '-created_at']

    def __str__(self):
        return f"Produced {self.quantity} x {self.product} on {self.production_date}"


class Sale(models.Model):
    """
    Sales records of finished products (represent invoice/bill).
    """
    sale_date = models.DateField()
    sale_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total revenue in INR")
    customer_name = models.CharField(max_length=150, blank=True, null=True)
    is_credit = models.BooleanField(default=False)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sale_date', '-created_at']

    def __str__(self):
        return f"Sale #{self.id} - Rs.{self.sale_amount} on {self.sale_date}"

    @property
    def due_amount(self):
        return self.sale_amount - self.amount_paid


class SaleItem(models.Model):
    """
    Individual products sold under a Sale bill.
    """
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sale_items')
    quantity = models.IntegerField(help_text="Quantity sold")
    brass = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Quantity in brass")
    rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Price per unit")
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total amount for this item")
    vehicle_no = models.CharField(max_length=50, blank=True, null=True, help_text="Vehicle / Truck number for dispatch")

    def __str__(self):
        return f"{self.quantity} x {self.product} in Sale #{self.sale.id}"


class Expense(models.Model):
    """
    Daily factory operating expenses (Labour, Electricity, Maintenance, Diesel, etc.)
    """
    CATEGORY_CHOICES = [
        ('Labour', 'Labour'),
        ('Transportation', 'Transportation'),
        ('Electricity', 'Electricity'),
        ('Diesel', 'Diesel'),
        ('Maintenance', 'Maintenance'),
        ('Miscellaneous', 'Miscellaneous'),
    ]
    expense_date = models.DateField()
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount spent in INR")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-expense_date', '-created_at']

    def __str__(self):
        return f"{self.category} - Rs.{self.amount} ({self.expense_date})"


class ActivityLog(models.Model):
    """
    System audit trails of changes made by administrators.
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100, help_text="e.g. Added Production, Deleted Sale")
    details = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.username if self.user else "System"
        return f"[{user_str}] {self.action} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class Notification(models.Model):
    """
    Low Stock alerts or system notifications.
    """
    NOTIFICATION_TYPES = [
        ('LOW_STOCK', 'Low Stock Alert'),
        ('SYSTEM', 'System Alert'),
    ]
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='LOW_STOCK')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.type}] {self.message[:50]}..."


class Loan(models.Model):
    """
    Business loans taken from financial companies.
    """
    company_name = models.CharField(max_length=150, help_text="Company/Bank name")
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total loan amount")
    installment_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Installment (Hafta) amount")
    loan_date = models.DateField(help_text="Date when loan was taken")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-loan_date', '-created_at']

    def __str__(self):
        return f"Loan from {self.company_name} - Rs.{self.loan_amount}"
