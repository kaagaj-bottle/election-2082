#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --no-input

echo "Seeding election data (skipped if present)..."
python manage.py seed_data

exec "$@"
