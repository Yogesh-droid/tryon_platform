from rest_framework import serializers
from .models import TryOnJob, Garment,Shop


class TryOnJobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TryOnJob
        fields = ['person_image', 'garment', 'selected_size', 'user_measurements']


class TryOnJobStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TryOnJob
        fields = ['id', 'status', 'result_image', 'error_message', 'created_at']


class GarmentManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garment
        fields = ['id', 'name', 'image', 'image2', 'prompt', 'sizes_available', 'size_measurements', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class ShopProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = [
            'name', 'slug', 'owner_phone', 'owner_email',
            'free_trials_per_customer', 'charge_customer_per_generation',
            'credit_balance', 'cost_per_generation',
        ]
        read_only_fields = ['slug', 'credit_balance', 'cost_per_generation']