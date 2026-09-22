from django.shortcuts import render

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Shop, Garment, EndUser, TryOnJob
from .serializers import TryOnJobCreateSerializer, TryOnJobStatusSerializer
from .tasks import run_tryon_job

from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from django.utils.text import slugify

from rest_framework.generics import RetrieveUpdateAPIView
from .serializers import ShopProfileSerializer


def get_or_create_user_shop(user):
    shop = Shop.objects.filter(owner_user=user).first()
    if shop:
        return shop

    base_slug = slugify(user.username) or f'user-{user.pk}'
    slug = base_slug
    suffix = 2
    while Shop.objects.filter(slug=slug).exists():
        slug = f'{base_slug}-{suffix}'
        suffix += 1

    return Shop.objects.create(
        owner_user=user,
        name=user.username,
        slug=slug,
        owner_phone='',
        owner_email=user.email,
    )


@api_view(['POST'])
def create_tryon_job(request, shop_slug):
    shop = get_object_or_404(Shop, slug=shop_slug, is_active=True)

    # Ensure this browser has a session (creates one on first visit)
    if not request.session.session_key:
        request.session.create()
    session_key = request.session.session_key

    end_user, _ = EndUser.objects.get_or_create(
        shop=shop,
        session_key=session_key
    )

    garment = get_object_or_404(Garment, id=request.data.get('garment'), shop=shop, is_active=True)

    serializer = TryOnJobCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    job = serializer.save(shop=shop, end_user=end_user, garment=garment, status='pending')

    run_tryon_job.delay(str(job.id))

    return Response({'id': str(job.id), 'status': job.status}, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
def get_tryon_job(request, job_id):
    job = get_object_or_404(TryOnJob, id=job_id)
    serializer = TryOnJobStatusSerializer(job)
    return Response(serializer.data)



@api_view(['POST'])
def shop_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    get_or_create_user_shop(user)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})


@api_view(['GET'])
def shop_dashboard(request):
    shop = request.user.shop  # via the OneToOneField related_name
    return Response({
        'name': shop.name,
        'slug': shop.slug,
        'credit_balance': shop.credit_balance,
        'cost_per_generation': shop.cost_per_generation,
        'free_trials_per_customer': shop.free_trials_per_customer,
        'charge_customer_per_generation': shop.charge_customer_per_generation,
    })

@api_view(['GET'])
def list_garments(request, shop_slug):
    shop = get_object_or_404(Shop, slug=shop_slug, is_active=True)
    garments = shop.garments.filter(is_active=True)
    data = [{
        'id': str(g.id),
        'name': g.name,
        'image': g.image.url,
        'sizes_available': g.sizes_available,
        'size_measurements': g.size_measurements
    } for g in garments]
    return Response(data)

shop_dashboard.authentication_classes = [TokenAuthentication]
shop_dashboard.permission_classes = [IsAuthenticated]

from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .serializers import GarmentManageSerializer


class ShopGarmentListCreateView(ListCreateAPIView):
    serializer_class = GarmentManageSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.shop.garments.all()

    def perform_create(self, serializer):
        serializer.save(shop=self.request.user.shop)


class ShopGarmentDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = GarmentManageSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.shop.garments.all()

class ShopProfileView(RetrieveUpdateAPIView):
    serializer_class = ShopProfileSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_or_create_user_shop(self.request.user)