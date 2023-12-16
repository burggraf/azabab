#!/bin/bash
# ./create-ssh-keys.sh <username> <port> <keys>
sudo docker exec -it ssh-server sh -c "./create-user.sh $1 $2"
sudo mkdir -p /home/ubuntu/data/$2/.ssh
sudo echo "$3" > /home/ubuntu/data/$2/.ssh/authorized_keys 

