#!/bin/bash
# stats.sh <container_name> <event_name>
# i.e. stats.sh container123 start
FILE="/home/ubuntu/stats/$(date -u '+%s').txt"

sudo docker stats \
	--no-stream \
	--format "$(date -u '+%s')\t$2\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" \
	$1 \
	| sed 's| / |\t|g' \
	| grep -v 'ssh-server' > $FILE

# Change file permissions to read and write for everyone
chmod 666 $FILE
