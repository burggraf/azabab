#!/bin/sh
sudo docker exec $1 kill -USR2 `sudo docker exec $1 pgrep -f start.sh`

