#!/bin/sh
#/home/pocketbase/pocketbase serve --http 0.0.0.0:8090 >> pb_data/log.txt 2>&1 &
# /exe is mapped to the current version passed in the header
/exe/pocketbase serve --http 0.0.0.0:8090 --dir pb_data --hooksDir pb_hooks --migrationsDir pb_migrations --publicDir pb_public >> pb_data/log.txt 2>&1 &
if [ -f /marmot/marmot.toml ]; then
    /home/pocketbase/marmot -config /marmot/marmot.toml >> pb_data/sync-log.txt 2>&1 &
fi
wait -n
exit $?
