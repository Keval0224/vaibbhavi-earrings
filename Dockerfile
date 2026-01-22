FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY . /usr/share/nginx/html

# Configure Nginx to listen on port 3002 instead of default 80
RUN sed -i 's/80;/3002;/g' /etc/nginx/conf.d/default.conf

EXPOSE 3002
CMD ["nginx", "-g", "daemon off;"]