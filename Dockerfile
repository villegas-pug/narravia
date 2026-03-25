FROM nginx:alpine

# Crear estructura de directorios
RUN mkdir -p /usr/share/nginx/html/_next
COPY public /usr/share/nginx/html
COPY .next/static /usr/share/nginx/html/_next/static

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]