import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tryon_platform.settings')
django.setup()

from core.models import TryOnJob
for job in TryOnJob.objects.all():
    print(job.id, job.status, job.error_message)
