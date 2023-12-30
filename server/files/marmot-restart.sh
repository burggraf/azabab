#!/bin/sh

# Find the PID of marmot
PID=$(pidof marmot)

# Check if marmot is running and restart it
if [ -n "$PID" ]; then
    # Send SIGHUP to lsyncd to gracefully reload it
    kill -HUP $PID
   /home/pocketbase/marmot -config /marmot/marmot.toml >> pb_data/sync-log.txt 2>&1 &
fi
