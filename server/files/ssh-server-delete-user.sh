#!/bin/bash
# ./ssh-server-delete-user.sh <username>
sudo docker exec -it ssh-server sh -c "./delete-user.sh $1"
