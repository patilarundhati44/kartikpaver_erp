from django.contrib import admin
from .models import (
    Product, RawMaterialPurchase, Production, Sale, Expense, 
    ActivityLog, Notification
)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'color', 'low_stock_threshold', 'created_at')
    list_filter = ('category', 'color')
    search_fields = ('name', 'category')


@admin.register(RawMaterialPurchase)
class RawMaterialPurchaseAdmin(admin.ModelAdmin):
    list_display = ('material_name', 'purchase_date', 'quantity', 'unit', 'purchase_amount', 'supplier_name')
    list_filter = ('material_name', 'purchase_date')
    search_fields = ('material_name', 'supplier_name', 'notes')


@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = ('product', 'production_date', 'quantity')
    list_filter = ('production_date', 'product')
    search_fields = ('product__name', 'product__color')


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('product', 'sale_date', 'quantity', 'sale_amount', 'customer_name')
    list_filter = ('sale_date', 'product')
    search_fields = ('product__name', 'product__color', 'customer_name')


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('category', 'expense_date', 'amount', 'description')
    list_filter = ('category', 'expense_date')
    search_fields = ('category', 'description')


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'timestamp', 'details')
    list_filter = ('action', 'timestamp')
    search_fields = ('action', 'details', 'user__username')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('type', 'message', 'is_read', 'timestamp')
    list_filter = ('type', 'is_read', 'timestamp')
    search_fields = ('message',)
