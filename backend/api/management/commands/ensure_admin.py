from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Ensures an admin superuser exists'

    def handle(self, *args, **options):
        username = 'kartikpaver'
        email = 'admin@kartikpaver.com'
        password = 'admin123'

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username, email, password)
            self.stdout.write(self.style.SUCCESS(f'Successfully created superuser "{username}"'))
        else:
            self.stdout.write(self.style.WARNING(f'Superuser "{username}" already exists.'))
