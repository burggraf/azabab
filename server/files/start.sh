#!/bin/sh

# Descriptive names for signals
START_POCKETBASE=SIGUSR1
STOP_POCKETBASE=SIGUSR2
START_MARMOT=SIGINT
STOP_MARMOT=SIGTERM
RESET_MARMOT=SIGHUP
SNAPSHOT_MARMOT=SIGALRM

# Process IDs
pocketbase_pid=0
marmot_pid=0

# Function to start Pocketbase
start_pocketbase() {
    if [ $pocketbase_pid -eq 0 ]; then
        echo "Starting Pocketbase..."
        /home/pocketbase/pocketbase serve --http 0.0.0.0:8090 >> pb_data/log.txt 2>&1 &
        pocketbase_pid=$!
    else
        echo "Pocketbase is already running."
    fi
}

# Function to start Marmot
start_marmot() {
    if [ $marmot_pid -eq 0 ]; then
        echo "Starting Marmot..."
        /home/pocketbase/marmot -config /marmot/marmot.toml >> pb_data/sync-log.txt 2>&1 &
        marmot_pid=$!
    else
        echo "Marmot is already running."
    fi
}

# Function to stop Pocketbase
stop_pocketbase() {
    if [ $pocketbase_pid -ne 0 ]; then
        echo "Stopping Pocketbase..."
        kill $pocketbase_pid
        wait $pocketbase_pid
        pocketbase_pid=0
    fi
}

# Function to stop Marmot
stop_marmot() {
    if [ $marmot_pid -ne 0 ]; then
        echo "Stopping Marmot..."
        kill $marmot_pid
        wait $marmot_pid
        marmot_pid=0
    fi
}

# Function to handle reset marmot
reset_marmot() {
    echo "Running reset marmot..."
    rm /marmot/marmot.cbor
    /home/pocketbase/marmot -config /marmot/marmot.toml -cleanup
}

# Function to handle snapshot marmot
snapshot_marmot() {
    echo "Running snapshot marmot..."
    /home/pocketbase/marmot -config /marmot/marmot.toml -save-snapshot
}

# Trap signals for various operations
trap 'start_pocketbase' $START_POCKETBASE
trap 'stop_pocketbase' $STOP_POCKETBASE
trap 'start_marmot' $START_MARMOT
trap 'stop_marmot' $STOP_MARMOT
trap 'reset_marmot' $RESET_MARMOT
trap 'snapshot_marmot' $SNAPSHOT_MARMOT

# Start both processes initially
start_pocketbase
if [ -f /marmot/marmot.toml ]; then
    start_marmot
fi

# Wait for processes to finish
# wait $pocketbase_pid $marmot_pid
# Infinite loop to keep the script running
while true; do
    # Optionally, check and restart processes if they are not running
    if [ $pocketbase_pid -eq 0 ]; then
        start_pocketbase
    fi
    if [ -f /marmot/marmot.toml ] && [ $marmot_pid -eq 0 ]; then
        start_marmot
    fi

    # Sleep to prevent the loop from consuming too much CPU
    sleep 10
done