from django.urls import path
from . import views

urlpatterns = [
    path('shops/<slug:shop_slug>/tryon/', views.create_tryon_job, name='create-tryon'),
    path('tryon/<uuid:job_id>/', views.get_tryon_job, name='get-tryon'),
    path('shops/<slug:shop_slug>/garments/', views.list_garments, name='list-garments'),  # this one
    path('auth/login/', views.shop_login, name='shop-login'),
    path('shop/dashboard/', views.shop_dashboard, name='shop-dashboard'),
    path('shop/garments/', views.ShopGarmentListCreateView.as_view(), name='shop-garments'),
    path('shop/garments/<uuid:pk>/', views.ShopGarmentDetailView.as_view(), name='shop-garment-detail'),
    path('shop/profile/', views.ShopProfileView.as_view(), name='shop-profile'),
]