#!/bin/sh
sudo docker exec $1 kill -INT `sudo docker exec $1 pgrep -f start.sh`

