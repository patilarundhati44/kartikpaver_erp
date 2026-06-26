from django.utils import timezone
from datetime import datetime, date, timedelta
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import Coalesce, TruncDate
from django.contrib.auth.models import User
from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    Product, RawMaterialPurchase, Production, Sale, Expense, 
    ActivityLog, Notification
)
from .serializers import (
    UserSerializer, ProductSerializer, RawMaterialPurchaseSerializer, 
    ProductionSerializer, SaleSerializer, ExpenseSerializer,
    ActivityLogSerializer, NotificationSerializer
)

# Custom JWT Login View
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra response details
        data['username'] = self.user.username
        data['is_staff'] = self.user.is_staff
        data['email'] = self.user.email
        
        # Log login activity
        ActivityLog.objects.create(
            user=self.user,
            action="Admin Login",
            details=f"User {self.user.username} logged in successfully."
        )
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# User Detail View
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


# Helper functions for activity logging and low stock check
def log_action(user, action_name, details_msg):
    ActivityLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action_name,
        details=details_msg
    )

def check_stock_and_notify():
    """Calculates stock for all products and creates a low stock notification if necessary."""
    products = Product.objects.with_stock()
    for product in products:
        if product.current_stock < product.low_stock_threshold:
            msg = f"Low Stock Alert: {product.color} {product.name} is at {product.current_stock} units (threshold {product.low_stock_threshold})."
            # Ensure we don't spam duplicate notifications for the same product if unread
            if not Notification.objects.filter(type='LOW_STOCK', is_read=False).filter(message__icontains=product.name).filter(message__icontains=product.color).exists():
                Notification.objects.create(
                    type='LOW_STOCK',
                    message=msg
                )


# Product ViewSet
class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category', 'color']
    ordering_fields = ['name', 'category', 'created_at']

    def get_queryset(self):
        # Always return with annotated stock
        return Product.objects.with_stock()

    def perform_create(self, serializer):
        product = serializer.save()
        log_action(self.request.user, "Added Product", f"Added new product: {product.color} {product.name}")
        check_stock_and_notify()

    def perform_update(self, serializer):
        product = serializer.save()
        log_action(self.request.user, "Updated Product", f"Updated product info for: {product.color} {product.name}")
        check_stock_and_notify()

    def perform_destroy(self, instance):
        log_action(self.request.user, "Deleted Product", f"Deleted product: {instance.color} {instance.name}")
        instance.delete()


# Raw Material Purchase ViewSet
class RawMaterialPurchaseViewSet(viewsets.ModelViewSet):
    queryset = RawMaterialPurchase.objects.all()
    serializer_class = RawMaterialPurchaseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['material_name', 'supplier_name', 'notes']
    ordering_fields = ['purchase_date', 'purchase_amount', 'created_at']

    def get_queryset(self):
        queryset = RawMaterialPurchase.objects.all()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(purchase_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(purchase_date__lte=end_date)
        return queryset

    def perform_create(self, serializer):
        purchase = serializer.save()
        log_action(self.request.user, "Recorded Purchase", f"Purchased {purchase.quantity} {purchase.unit} of {purchase.material_name} for Rs.{purchase.purchase_amount}")

    def perform_update(self, serializer):
        purchase = serializer.save()
        log_action(self.request.user, "Updated Purchase", f"Updated purchase record of {purchase.material_name} (Rs.{purchase.purchase_amount})")

    def perform_destroy(self, instance):
        log_action(self.request.user, "Deleted Purchase", f"Deleted purchase record of {instance.material_name} (Rs.{instance.purchase_amount}) on {instance.purchase_date}")
        instance.delete()


# Production ViewSet
class ProductionViewSet(viewsets.ModelViewSet):
    queryset = Production.objects.all()
    serializer_class = ProductionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__color', 'product__category']
    ordering_fields = ['production_date', 'quantity', 'created_at']

    def get_queryset(self):
        queryset = Production.objects.all()
        product_id = self.request.query_params.get('product')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if start_date:
            queryset = queryset.filter(production_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(production_date__lte=end_date)
        return queryset

    def perform_create(self, serializer):
        production = serializer.save()
        log_action(self.request.user, "Added Production", f"Recorded production of {production.quantity} x {production.product}")
        check_stock_and_notify()

    def perform_update(self, serializer):
        production = serializer.save()
        log_action(self.request.user, "Updated Production", f"Updated production entry to {production.quantity} x {production.product}")
        check_stock_and_notify()

    def perform_destroy(self, instance):
        log_action(self.request.user, "Deleted Production", f"Deleted production entry of {instance.quantity} x {instance.product} on {instance.production_date}")
        instance.delete()
        check_stock_and_notify()


# Sales ViewSet
class SalesViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__color', 'product__category', 'customer_name']
    ordering_fields = ['sale_date', 'quantity', 'sale_amount', 'created_at']

    def get_queryset(self):
        queryset = Sale.objects.all()
        product_id = self.request.query_params.get('product')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if start_date:
            queryset = queryset.filter(sale_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(sale_date__lte=end_date)
        return queryset

    def perform_create(self, serializer):
        sale = serializer.save()
        log_action(self.request.user, "Recorded Sale", f"Sold {sale.quantity} x {sale.product} to {sale.customer_name or 'Walk-in'} for Rs.{sale.sale_amount}")
        check_stock_and_notify()

    def perform_update(self, serializer):
        sale = serializer.save()
        log_action(self.request.user, "Updated Sale", f"Updated sale entry to {sale.quantity} x {sale.product} (Rs.{sale.sale_amount})")
        check_stock_and_notify()

    def perform_destroy(self, instance):
        log_action(self.request.user, "Deleted Sale", f"Deleted sale of {instance.quantity} x {instance.product} on {instance.sale_date}")
        instance.delete()
        check_stock_and_notify()


# Expense ViewSet
class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['category', 'description']
    ordering_fields = ['expense_date', 'amount', 'created_at']

    def get_queryset(self):
        queryset = Expense.objects.all()
        category = self.request.query_params.get('category')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if category:
            queryset = queryset.filter(category=category)
        if start_date:
            queryset = queryset.filter(expense_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(expense_date__lte=end_date)
        return queryset

    def perform_create(self, serializer):
        expense = serializer.save()
        log_action(self.request.user, "Recorded Expense", f"Spent Rs.{expense.amount} on {expense.category}: {expense.description or 'No desc'}")

    def perform_update(self, serializer):
        expense = serializer.save()
        log_action(self.request.user, "Updated Expense", f"Updated expense: {expense.category} (Rs.{expense.amount})")

    def perform_destroy(self, instance):
        log_action(self.request.user, "Deleted Expense", f"Deleted expense record of {instance.category} (Rs.{instance.amount}) on {instance.expense_date}")
        instance.delete()


# Activity Log ViewSet (Read-Only)
class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer


# Notification ViewSet
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})


# Custom API View: Dashboard Summary
@api_view(['GET'])
def dashboard_summary(request):
    """
    Computes all high-level statistics for the dashboard.
    - Stock metrics (Total produced - Total sold)
    - Today's production, sales, purchases, and expenses
    - Monthly summaries
    - Estimated profit
    - Low stock products list
    - Recent activities (last 10)
    - Unread notifications (last 10)
    """
    today = timezone.now().date()
    first_of_month = date(today.year, today.month, 1)

    # 1. Stock calculations
    products = Product.objects.with_stock()
    total_stock = sum(p.current_stock for p in products)
    low_stock_alerts = [
        {
            'id': p.id,
            'name': p.name,
            'color': p.color,
            'category': p.category,
            'current_stock': p.current_stock,
            'threshold': p.low_stock_threshold
        } for p in products if p.current_stock < p.low_stock_threshold
    ]

    # 2. Today's stats
    today_prod = Production.objects.filter(production_date=today).aggregate(total=Sum('quantity'))['total'] or 0
    today_sales_qty = Sale.objects.filter(sale_date=today).aggregate(total=Sum('quantity'))['total'] or 0
    today_sales_amt = Sale.objects.filter(sale_date=today).aggregate(total=Sum('sale_amount'))['total'] or 0.0
    today_purchases = RawMaterialPurchase.objects.filter(purchase_date=today).aggregate(total=Sum('purchase_amount'))['total'] or 0.0
    today_expenses = Expense.objects.filter(expense_date=today).aggregate(total=Sum('amount'))['total'] or 0.0

    # 3. Monthly stats
    monthly_prod = Production.objects.filter(production_date__gte=first_of_month, production_date__lte=today).aggregate(total=Sum('quantity'))['total'] or 0
    monthly_sales_qty = Sale.objects.filter(sale_date__gte=first_of_month, sale_date__lte=today).aggregate(total=Sum('quantity'))['total'] or 0
    monthly_sales_amt = Sale.objects.filter(sale_date__gte=first_of_month, sale_date__lte=today).aggregate(total=Sum('sale_amount'))['total'] or 0.0
    monthly_purchases = RawMaterialPurchase.objects.filter(purchase_date__gte=first_of_month, purchase_date__lte=today).aggregate(total=Sum('purchase_amount'))['total'] or 0.0
    monthly_expenses = Expense.objects.filter(expense_date__gte=first_of_month, expense_date__lte=today).aggregate(total=Sum('amount'))['total'] or 0.0

    # 4. Profit calculation
    # Formula: Estimated Profit = Total Sales Amount - (Total Purchase Amount + Total Expenses)
    total_sales_all_time = Sale.objects.aggregate(total=Sum('sale_amount'))['total'] or 0.0
    total_purchases_all_time = RawMaterialPurchase.objects.aggregate(total=Sum('purchase_amount'))['total'] or 0.0
    total_expenses_all_time = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0.0
    
    estimated_profit_all_time = float(total_sales_all_time) - (float(total_purchases_all_time) + float(total_expenses_all_time))
    estimated_profit_month = float(monthly_sales_amt) - (float(monthly_purchases) + float(monthly_expenses))

    # 5. Feeds
    recent_activities = ActivityLogSerializer(ActivityLog.objects.all()[:10], many=True).data
    unread_notifications = NotificationSerializer(Notification.objects.filter(is_read=False)[:10], many=True).data

    data = {
        'total_available_stock': total_stock,
        'today': {
            'production': today_prod,
            'sales_quantity': today_sales_qty,
            'sales_amount': float(today_sales_amt),
            'purchases_amount': float(today_purchases),
            'expenses_amount': float(today_expenses)
        },
        'monthly': {
            'production': monthly_prod,
            'sales_quantity': monthly_sales_qty,
            'sales_amount': float(monthly_sales_amt),
            'purchases_amount': float(monthly_purchases),
            'expenses_amount': float(monthly_expenses),
            'estimated_profit': estimated_profit_month
        },
        'all_time': {
            'sales_amount': float(total_sales_all_time),
            'purchases_amount': float(total_purchases_all_time),
            'expenses_amount': float(total_expenses_all_time),
            'estimated_profit': estimated_profit_all_time
        },
        'low_stock_alerts': low_stock_alerts,
        'recent_activities': recent_activities,
        'unread_notifications': unread_notifications
    }
    return Response(data)


# Custom API View: Date Range Reports
@api_view(['GET'])
def reports_module(request):
    """
    Generates structured summaries for reports.
    Expects GET params: start_date (YYYY-MM-DD) and end_date (YYYY-MM-DD).
    If missing, defaults to last 30 days.
    """
    start_date_str = request.query_params.get('start_date')
    end_date_str = request.query_params.get('end_date')

    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    else:
        start_date = timezone.now().date() - timedelta(days=30)

    if end_date_str:
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    else:
        end_date = timezone.now().date()

    # Query aggregates for specific period
    period_prod = Production.objects.filter(production_date__gte=start_date, production_date__lte=end_date).aggregate(total=Coalesce(Sum('quantity'), 0))['total']
    period_sales_qty = Sale.objects.filter(sale_date__gte=start_date, sale_date__lte=end_date).aggregate(total=Coalesce(Sum('quantity'), 0))['total']
    period_sales_amt = Sale.objects.filter(sale_date__gte=start_date, sale_date__lte=end_date).aggregate(total=Coalesce(Sum('sale_amount'), 0.0))['total']
    period_purchases_amt = RawMaterialPurchase.objects.filter(purchase_date__gte=start_date, purchase_date__lte=end_date).aggregate(total=Coalesce(Sum('purchase_amount'), 0.0))['total']
    period_expenses_amt = Expense.objects.filter(expense_date__gte=start_date, expense_date__lte=end_date).aggregate(total=Coalesce(Sum('amount'), 0.0))['total']
    
    period_profit = float(period_sales_amt) - (float(period_purchases_amt) + float(period_expenses_amt))

    # Current Stock status at end date (approx: total productions up to end_date - total sales up to end_date)
    prod_up_to_end = Production.objects.filter(production_date__lte=end_date).aggregate(total=Coalesce(Sum('quantity'), 0))['total']
    sales_up_to_end = Sale.objects.filter(sale_date__lte=end_date).aggregate(total=Coalesce(Sum('quantity'), 0))['total']
    stock_at_end_date = prod_up_to_end - sales_up_to_end

    # Fetch detailed logs for export/view
    production_records = ProductionSerializer(Production.objects.filter(production_date__gte=start_date, production_date__lte=end_date), many=True).data
    sales_records = SaleSerializer(Sale.objects.filter(sale_date__gte=start_date, sale_date__lte=end_date), many=True).data
    purchase_records = RawMaterialPurchaseSerializer(RawMaterialPurchase.objects.filter(purchase_date__gte=start_date, purchase_date__lte=end_date), many=True).data
    expense_records = ExpenseSerializer(Expense.objects.filter(expense_date__gte=start_date, expense_date__lte=end_date), many=True).data

    data = {
        'production': production_records,
        'sales': sales_records,
        'purchases': purchase_records,
        'expenses': expense_records,
        'totals': {
            'production': period_prod,
            'sales': float(period_sales_amt),
            'purchases': float(period_purchases_amt),
            'expenses': float(period_expenses_amt),
            'profit': period_profit,
            'stock_at_end': stock_at_end_date
        }
    }
    return Response(data)


# Custom API View: Trend Analytics
@api_view(['GET'])
def analytics_module(request):
    """
    Aggregates historical data by date for trends plotting in Recharts.
    Returns:
    - Last 15 days trend of Production vs Sales (quantities)
    - Last 15 days trend of Purchases vs Expenses (INR amount)
    - Current Product Stock balances (Overview chart)
    - Expense breakdown by category
    """
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=14)  # Last 15 days
    
    # 1. Generate empty days map
    date_range = [start_date + timedelta(days=x) for x in range(15)]
    trends_map = {d.strftime('%Y-%m-%d'): {'date': d.strftime('%b %d'), 'production': 0, 'sales': 0, 'purchases': 0, 'expenses': 0} for d in date_range}

    # Populate production quantities
    prod_data = Production.objects.filter(production_date__gte=start_date, production_date__lte=end_date).values('production_date').annotate(qty=Sum('quantity'))
    for entry in prod_data:
        d_str = entry['production_date'].strftime('%Y-%m-%d')
        if d_str in trends_map:
            trends_map[d_str]['production'] = entry['qty']

    # Populate sales quantities & amounts (for trend mapping, we plot amounts here)
    sales_data = Sale.objects.filter(sale_date__gte=start_date, sale_date__lte=end_date).values('sale_date').annotate(qty=Sum('quantity'), amt=Sum('sale_amount'))
    for entry in sales_data:
        d_str = entry['sale_date'].strftime('%Y-%m-%d')
        if d_str in trends_map:
            trends_map[d_str]['sales_qty'] = entry['qty']
            trends_map[d_str]['sales'] = float(entry['amt'])

    # Populate purchases amounts
    purch_data = RawMaterialPurchase.objects.filter(purchase_date__gte=start_date, purchase_date__lte=end_date).values('purchase_date').annotate(amt=Sum('purchase_amount'))
    for entry in purch_data:
        d_str = entry['purchase_date'].strftime('%Y-%m-%d')
        if d_str in trends_map:
            trends_map[d_str]['purchases'] = float(entry['amt'])

    # Populate expenses amounts
    exp_data = Expense.objects.filter(expense_date__gte=start_date, expense_date__lte=end_date).values('expense_date').annotate(amt=Sum('amount'))
    for entry in exp_data:
        d_str = entry['expense_date'].strftime('%Y-%m-%d')
        if d_str in trends_map:
            trends_map[d_str]['expenses'] = float(entry['amt'])

    trends_list = sorted(list(trends_map.values()), key=lambda x: datetime.strptime(x['date'], '%b %d') if 'date' in x else datetime.now())

    # 3. Expense distribution
    expense_distribution = list(
        Expense.objects.values('category').annotate(amount=Sum('amount')).order_by('-amount')
    )
    for item in expense_distribution:
        item['amount'] = float(item['amount'])

    # 4. Category Sales shares
    category_shares = list(
        Sale.objects.annotate(category=F('product__category')).values('category').annotate(value=Sum('sale_amount')).order_by('-value')
    )
    for item in category_shares:
        item['value'] = float(item['value'])

    # 5. Financials overview
    total_sales = Sale.objects.aggregate(total=Sum('sale_amount'))['total'] or 0.0
    total_purchases = RawMaterialPurchase.objects.aggregate(total=Sum('purchase_amount'))['total'] or 0.0
    total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0.0
    
    financials = {
        'total_sales': float(total_sales),
        'total_purchases': float(total_purchases),
        'total_expenses': float(total_expenses)
    }

    # 6. Accumulate 'costs' for the timeline chart (purchases + expenses)
    for t in trends_list:
        t['costs'] = t.get('purchases', 0.0) + t.get('expenses', 0.0)

    data = {
        'timeline': trends_list,
        'expense_distribution': expense_distribution,
        'category_shares': category_shares,
        'financials': financials
    }
    return Response(data)
