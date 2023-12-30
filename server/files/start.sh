#!/bin/sh

# Start PocketBase
./pocketbase serve --http 0.0.0.0:8090 >> pb_data/log.txt 2>&1 &

# Check if /marmot/marmot.toml exists
if [ -f /marmot/marmot.toml ]; then
    # Determine if it's a PRIMARY or REPLICA node
    if grep -q "publish=true" /marmot/marmot.toml; then
        # It's a PRIMARY node
        IS_PRIMARY=true
    elif grep -q "publish=false" /marmot/marmot.toml; then
        # It's a REPLICA node
        IS_PRIMARY=false
    fi

    # Check for /marmot/reset and perform cleanup if necessary
    if [ -f /marmot/reset ]; then
        rm /marmot/marmot.cbor
        echo "RESETTING MARMOT" >> pb_data/sync-log.txt
        /home/pocketbase/marmot -config /marmot/marmot.toml -cleanup >> pb_data/sync-log.txt
        rm /marmot/reset
    fi

    # For PRIMARY node, check for snapshot log
    if [ "$IS_PRIMARY" = true ]; then
        if [ ! -f /marmot/snapshot-log.txt ]; then
            echo "CREATING SNAPSHOT" >> pb_data/sync-log.txt
            /home/pocketbase/marmot -config /marmot/marmot.toml -save-snapshot >> pb_data/sync-log.txt
            date > /marmot/snapshot-log.txt
        fi
    fi

    # Run marmot command
    /home/pocketbase/marmot -config /marmot/marmot.toml >> pb_data/sync-log.txt 2>&1 &
fi

# Wait for any background process to finish
wait -n

# Exit with the status of the last command waited on
exit $?
