#!/bin/sh

# Find the PID of sshd
#SYNC_PID=$(pidof /usr/sbin/sshd)
SYNC_PID=`cat /lsyncd.pid`

# Check if SSHD is running
if [ -n "$SYNC_PID" ]; then
    # Send SIGHUP to SSHD to gracefully reload it
    kill -HUP $SYNC_PID
else
    # Start SSHD if it's not running
    /usr/bin/lsyncd -pidfile /lsyncd.pid /sync-server/lsyncd.conf.lua 2>&1 &
fi

