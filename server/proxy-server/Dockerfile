FROM alpine:latest
RUN apk add --no-cache haproxy
# Install GeoIP packages
RUN apk add --no-cache libmaxminddb

# Copy HAProxy configuration file from host to container
#COPY haproxy.cfg /cfg/haproxy.cfg

# Set the default command to run HAProxy
CMD ["haproxy", "-f", "/cfg/haproxy.cfg"]
