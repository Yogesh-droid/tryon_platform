from django.contrib import admin

from django.contrib import admin
from .models import Shop, Garment, EndUser, TryOnJob


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner_phone', 'credit_balance', 'image_generation_method', 'is_active', 'created_at')
    list_editable = ('image_generation_method',)
    list_filter = ('is_active',)
    search_fields = ('name', 'owner_phone', 'owner_email')
    readonly_fields = ('id', 'created_at')


@admin.register(Garment)
class GarmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'is_active', 'created_at')
    list_filter = ('shop', 'is_active')
    search_fields = ('name',)


@admin.register(EndUser)
class EndUserAdmin(admin.ModelAdmin):
    list_display = ('shop', 'phone', 'generations_used', 'created_at')
    list_filter = ('shop',)
    search_fields = ('phone', 'session_key')


@admin.register(TryOnJob)
class TryOnJobAdmin(admin.ModelAdmin):
    list_display = ('shop', 'end_user', 'garment', 'status', 'cost_charged_to_shop', 'created_at')
    list_filter = ('status', 'shop')
    readonly_fields = ('id', 'created_at')