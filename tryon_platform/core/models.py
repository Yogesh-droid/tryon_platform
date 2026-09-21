from django.db import models
from django.contrib.auth.models import User
import uuid
from django.db import models


class Shop(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shop', null=True, blank=True)
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    owner_phone = models.CharField(max_length=15)
    owner_email = models.EmailField(blank=True)
    credit_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_per_generation = models.DecimalField(max_digits=6, decimal_places=2, default=6.00)
    free_trials_per_customer = models.PositiveIntegerField(default=2)
    charge_customer_per_generation = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    IMAGE_GENERATION_CHOICES = [
        ('fashn', 'Fashn'),
        ('mock', 'Mock'),
        ('gemini', 'Gemini Nano Banana'),
        ('gemini', 'Gemini Nano Banana (API)'),
        ('gemini_playwright', 'Gemini (Playwright Automation)'),
        ('idm_vton', 'IDM-VTON (Gradio)'),
    ]
    image_generation_method = models.CharField(
        max_length=20,
        choices=IMAGE_GENERATION_CHOICES,
        default='fashn'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Garment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='garments')
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='garments/')
    image2 = models.ImageField(upload_to='garments/', blank=True, null=True, help_text="Optional second image of the garment")
    prompt = models.TextField(blank=True, null=True, help_text="Custom prompt instructions for Gemini")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.shop.name})"


class EndUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='end_users')
    session_key = models.CharField(max_length=100)  # browser session identifier for now
    phone = models.CharField(max_length=15, blank=True)  # filled in later if you add real verification
    generations_used = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('shop', 'session_key')


class TryOnJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='tryon_jobs')
    end_user = models.ForeignKey(EndUser, on_delete=models.CASCADE, related_name='tryon_jobs')
    garment = models.ForeignKey(Garment, on_delete=models.SET_NULL, null=True)

    person_image = models.ImageField(upload_to='tryon/person/')
    result_image = models.ImageField(upload_to='tryon/result/', null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    cost_charged_to_shop = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)