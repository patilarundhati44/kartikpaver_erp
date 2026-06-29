from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, RawMaterialPurchase, Production, Sale, SaleItem, Expense, ActivityLog, Notification, Loan


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']


class ProductSerializer(serializers.ModelSerializer):
    # These fields will be populated by the `with_stock` custom queryset annotation
    current_stock = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
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


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_color = serializers.ReadOnlyField(source='product.color')
    product_category = serializers.ReadOnlyField(source='product.category')

    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_color', 
            'product_category', 'quantity', 'brass', 'rate', 'amount', 'vehicle_no'
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity sold must be greater than zero.")
        return value

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    due_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_brass = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            'id', 'sale_date', 'sale_amount', 'customer_name', 
            'is_credit', 'amount_paid', 'due_amount', 'created_at',
            'items', 'total_brass'
        ]

    def get_total_brass(self, obj):
        return sum(item.brass for item in obj.items.all())

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
        items_data = data.get('items', [])
        sale_amount = data.get('sale_amount')
        amount_paid = data.get('amount_paid', 0)

        # Basic amount paid check
        if sale_amount is not None and amount_paid > sale_amount:
            raise serializers.ValidationError({
                "amount_paid": "Amount paid cannot be greater than the total sale amount."
            })

        if not items_data and not self.instance:
            raise serializers.ValidationError({
                "items": "A sale must contain at least one item."
            })

        # Stock validation grouping by product
        product_quantities = {}
        for item in items_data:
            prod = item.get('product')
            brass = item.get('brass', 0)
            product_quantities[prod] = product_quantities.get(prod, 0) + brass

        for prod, brass in product_quantities.items():
            orig_brass = 0
            if self.instance:
                orig_brass = sum(item.brass for item in self.instance.items.filter(product=prod))

            current_stock = prod.current_stock_value + orig_brass
            if brass > current_stock:
                raise serializers.ValidationError({
                    "items": f"Insufficient stock! Available stock for {prod} is only {current_stock} Brass. You entered {brass} Brass."
                })

        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Determine is_credit automatically
        sale_amount = validated_data.get('sale_amount')
        amount_paid = validated_data.get('amount_paid', 0)
        validated_data['is_credit'] = amount_paid < sale_amount

        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        return sale

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        instance.sale_date = validated_data.get('sale_date', instance.sale_date)
        instance.sale_amount = validated_data.get('sale_amount', instance.sale_amount)
        instance.customer_name = validated_data.get('customer_name', instance.customer_name)
        instance.amount_paid = validated_data.get('amount_paid', instance.amount_paid)

        instance.is_credit = instance.amount_paid < instance.sale_amount
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                SaleItem.objects.create(sale=instance, **item_data)

        return instance


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


class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = '__all__'
