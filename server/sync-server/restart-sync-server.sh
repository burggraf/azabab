#!/bin/sh

# Find the PID of lsyncd
PID=$(pidof /usr/bin/lsyncd)

# Check if lsyncd is running
if [ -n "$PID" ]; then
    # Send SIGHUP to lsyncd to gracefully reload it
    kill -HUP $PID
else
    # Start SSHD if it's not running
    /usr/bin/lsyncd -nodaemon -pidfile /lsyncd.pid /sync-server/lsyncd.conf.lua
fi
