#!/bin/sh
sudo docker exec $1 kill -USR1 `sudo docker exec $1 pgrep -f start.sh`

