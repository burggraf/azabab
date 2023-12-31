#!/bin/sh
sudo docker exec $1 kill -TERM `sudo docker exec $1 pgrep -f start.sh`

