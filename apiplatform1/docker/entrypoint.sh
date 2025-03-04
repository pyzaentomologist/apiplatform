#!/usr/bin/env bash
 
composer install --no-scripts --no-interaction --prefer-dist --optimize-autoloader
 
exec "$@"