#!/bin/bash
if [ -z "$1" ]
  then
    echo "syntax: ./deploy_cadvisor.sh <host-name>"
    echo "example: ./deploy_cadvisor.sh west-1.azabab.com"
    exit 1
fi
USER="ubuntu@$1"

echo "*** Deploying cAdvisor on Ubuntu 23.04 ***"

# Update and upgrade the system
ssh $USER "sudo apt update && sudo apt upgrade -y"

# Ensure Docker is installed
ssh $USER "sudo apt install docker.io -y"
ssh $USER "sudo systemctl start docker && sudo systemctl enable docker"

# Pull and run the cAdvisor Docker image
ssh $USER "sudo docker pull gcr.io/cadvisor/cadvisor:v0.43.0"
ssh $USER "sudo docker run \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:rw \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8080:8080 \
  --detach=true \
  --name=cadvisor \
  gcr.io/cadvisor/cadvisor:v0.43.0"

echo "*** cAdvisor deployment complete ***"
