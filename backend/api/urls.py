from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView, UserViewSet, ProductViewSet, 
    RawMaterialPurchaseViewSet, ProductionViewSet, SalesViewSet, 
    ExpenseViewSet, ActivityLogViewSet, NotificationViewSet, LoanViewSet,
    dashboard_summary, reports_module, analytics_module
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'purchases', RawMaterialPurchaseViewSet, basename='purchase')
router.register(r'productions', ProductionViewSet, basename='production')
router.register(r'sales', SalesViewSet, basename='sale')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'activities', ActivityLogViewSet, basename='activity')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'loans', LoanViewSet, basename='loan')

urlpatterns = [
    # Router paths
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Custom dashboard, reports and analytics modules
    path('dashboard/summary/', dashboard_summary, name='dashboard_summary'),
    path('reports/summary/', reports_module, name='reports_summary'),
    path('analytics/summary/', analytics_module, name='analytics_summary'),
]
