#!/bin/bash
echo "*** Logging Resource Usage for Docker Containers ***"

# Define log file
LOG_FILE="/var/log/docker_resource_usage.log"

# List all running containers
containers=$(docker ps --format '{{.Names}}')

# Log resource usage for each container
for container in $containers; do
    # Get CPU, memory, and network usage stats. Adjust these commands based on the specific data you need
    stats=$(docker stats --no-stream --format "{{.Name}}: CPU={{.CPUPerc}} Memory={{.MemUsage}} NetIO={{.NetIO}}" $container)
    
    # Log the stats with a timestamp
    #echo "$(date): $stats" >> $LOG_FILE
    echo "$(date): $stats"

    
done
