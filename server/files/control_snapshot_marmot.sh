#!/bin/sh
sudo docker exec $1 kill -ALRM `sudo docker exec $1 pgrep -f start.sh`

