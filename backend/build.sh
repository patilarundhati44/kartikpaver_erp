#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files for Django admin page
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate

# Provision default admin user if not exists
python manage.py ensure_admin
