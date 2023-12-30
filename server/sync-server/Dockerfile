# Use Alpine Linux as the base image
FROM alpine:latest

# Install lsyncd and SSH client
RUN apk update
RUN apk add --no-cache lsyncd openssh-client

# Copy the lsyncd configuration file into the container
# COPY ./lsyncd.conf.lua /sync-server/lsyncd.conf.lua
# EXPOSE 22

# Expose any ports if necessary (optional, depending on your setup)
# EXPOSE 22
COPY ./restart-sync-server.sh /restart-sync-server.sh
COPY ./start.sh /start.sh
# Define the default command to run lsyncd
CMD "./start.sh"

