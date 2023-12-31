#!/bin/sh
sudo docker exec $1 kill -HUP `sudo docker exec $1 pgrep -f start.sh`

