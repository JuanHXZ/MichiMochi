FROM ubuntu:22.04

LABEL maintainer="Equipo ADSO - MichiMochi Dessert Co."
LABEL description="Servidor Web Apache en Ubuntu 22.04 para MichiMochi (GA10-220501097-AA5-EV01)"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends apache2 curl ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copiar portal estatico de MichiMochi al DocumentRoot de Apache
COPY ./html/index.html /var/www/html/index.html

EXPOSE 80

CMD ["apachectl", "-D", "FOREGROUND"]
