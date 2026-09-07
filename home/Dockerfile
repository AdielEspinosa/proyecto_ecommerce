FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY index.html /usr/share/nginx/html/index.html

COPY styles.css /usr/share/nginx/html/styles.css

COPY imagenes /usr/share/nginx/html/imagenes

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]