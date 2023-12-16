#!/bin/bash
# ./ssh-server-create-user.sh <username> <port>
sudo docker exec -it ssh-server sh -c "./create-user.sh $1 $2"
