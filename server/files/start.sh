#!/bin/sh
/home/pocketbase/pocketbase serve --http 0.0.0.0:8090 >> pb_data/log.txt 2>&1 &
if [ -f /marmot/marmot.toml ]; then
    /home/pocketbase/marmot -config /marmot/marmot.toml >> pb_data/sync-log.txt 2>&1 &
fi
wait -n
exit $?
