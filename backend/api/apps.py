from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import sys
        # Prevent running migrations during migrations command or shell
        if not any(arg in sys.argv for arg in ['makemigrations', 'migrate', 'shell', 'test']):
            from django.core.management import call_command
            try:
                print("[AUTO-MIGRATION] Programmatically running makemigrations...")
                call_command('makemigrations', 'api', interactive=False)
                print("[AUTO-MIGRATION] Programmatically running migrate...")
                call_command('migrate', interactive=False)
                print("[AUTO-MIGRATION] Database is fully up to date!")
            except Exception as e:
                import traceback
                print(f"[AUTO-MIGRATION] Error: {e}", file=sys.stderr)
                traceback.print_exc()
