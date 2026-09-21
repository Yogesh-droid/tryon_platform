from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Shop


class ShopAccessTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='unlinked', password='password')

	def test_profile_without_shop_creates_initial_shop(self):
		self.client.force_authenticate(user=self.user)

		response = self.client.get('/api/shop/profile/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['name'], 'unlinked')
		self.assertTrue(Shop.objects.filter(owner_user=self.user, slug='unlinked').exists())

	def test_login_without_shop_provisions_shop(self):
		response = self.client.post(
			'/api/auth/login/',
			{'username': 'unlinked', 'password': 'password'},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertTrue(Shop.objects.filter(owner_user=self.user).exists())

	def test_profile_for_shop_owner_is_available(self):
		Shop.objects.create(
			owner_user=self.user,
			name='Test Shop',
			slug='test-shop',
			owner_phone='1234567890',
		)
		self.client.force_authenticate(user=self.user)

		response = self.client.get('/api/shop/profile/')

		self.assertEqual(response.status_code, 200)

# Create your tests here.
