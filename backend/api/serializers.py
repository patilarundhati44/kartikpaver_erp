from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, RawMaterialPurchase, Production, Sale, Expense, ActivityLog, Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']


class ProductSerializer(serializers.ModelSerializer):
    # These fields will be populated by the `with_stock` custom queryset annotation
    current_stock = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'color', 'description', 
            'low_stock_threshold', 'current_stock', 'is_low_stock', 
            'created_at', 'updated_at'
        ]


class RawMaterialPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterialPurchase
        fields = '__all__'


class ProductionSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_color = serializers.ReadOnlyField(source='product.color')
    product_category = serializers.ReadOnlyField(source='product.category')

    class Meta:
        model = Production
        fields = [
            'id', 'production_date', 'product', 'product_name', 
            'product_color', 'product_category', 'quantity', 'created_at'
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity produced must be greater than zero.")
        return value


class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_color = serializers.ReadOnlyField(source='product.color')
    product_category = serializers.ReadOnlyField(source='product.category')
    due_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'sale_date', 'product', 'product_name', 
            'product_color', 'product_category', 'quantity', 
            'sale_amount', 'customer_name', 'is_credit', 
            'amount_paid', 'due_amount', 'created_at'
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity sold must be greater than zero.")
        return value

    def validate_sale_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Sale amount cannot be negative.")
        return value

    def validate_amount_paid(self, value):
        if value < 0:
            raise serializers.ValidationError("Amount paid cannot be negative.")
        return value

    def validate(self, data):
        """
        Validate that we don't sell more than the available stock.
        Also check that amount_paid does not exceed total sale_amount.
        """
        product = data.get('product')
        quantity = data.get('quantity')
        sale_amount = data.get('sale_amount')
        amount_paid = data.get('amount_paid')
        
        # If updating, get values from instance if not provided in payload
        if self.instance:
            product = product or self.instance.product
            quantity = quantity if quantity is not None else self.instance.quantity
            sale_amount = sale_amount if sale_amount is not None else self.instance.sale_amount
            amount_paid = amount_paid if amount_paid is not None else self.instance.amount_paid
        else:
            if amount_paid is None:
                amount_paid = 0

        if sale_amount is not None and amount_paid > sale_amount:
            raise serializers.ValidationError({
                "amount_paid": "Amount paid cannot be greater than the total sale amount."
            })
        
        # If updating, get the original sale quantity to calculate net change
        orig_qty = 0
        if self.instance:
            orig_qty = self.instance.quantity
            
        current_stock = product.current_stock_value + orig_qty
        
        if quantity is not None and quantity > current_stock:
            raise serializers.ValidationError({
                "quantity": f"Insufficient stock! Available stock for {product} is only {current_stock} units. You entered {quantity}."
            })
            
        return data


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Expense amount must be greater than zero.")
        return value


class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'username', 'action', 'details', 'timestamp']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
