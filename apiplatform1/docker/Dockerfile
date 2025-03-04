# Użycie obrazu PHP 8 z Apache
FROM php:8.3-apache

RUN a2enmod rewrite
# Aktualizacja pakietów systemowych i instalacja niezbędnych narzędzi
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libpq-dev \
    libicu-dev \
    libxml2-dev \
    libzip-dev \
    libonig-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    && docker-php-ext-configure zip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install zip pdo pdo_pgsql pgsql intl xml gd \
    && pecl install apcu \
    && docker-php-ext-enable apcu

RUN apt update && apt install -y postgresql-client

# Sprawdzenie, czy rozszerzenia są poprawnie załadowane (dla debugowania)
RUN php -m | grep -E 'pdo|pgsql'

# Instalacja Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Instalacja Symfony CLI
RUN curl -sS https://get.symfony.com/cli/installer | bash && \
    mv /root/.symfony*/bin/symfony /usr/local/bin/symfony

COPY docker/apache.conf /etc/apache2/sites-enabled/000-default.conf

# Ustawienie katalogu roboczego
WORKDIR /var/www

# Kopiowanie plików projektu
COPY . .

RUN mkdir -p var && chown -R www-data:www-data /var

# Ustawienie uprawnień dla katalogu var (cache, logs)
RUN chown -R www-data:www-data var && chmod -R 777 var

# Instalacja zależności przez Composer
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader && composer update symfony/runtime

# Ustawienie uprawnień dla katalogu var (cache, logs)
RUN chown -R www-data:www-data vendor && chmod -R 777 vendor

CMD ["apache2-foreground"]