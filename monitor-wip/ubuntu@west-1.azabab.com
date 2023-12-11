#!/bin/bash
echo "*** Checking for Inactive Docker Containers ***"

# Define the threshold for inactivity in seconds (5 minutes here)
INACTIVITY_THRESHOLD=300

# List all running containers
containers=$(docker ps --format '{{.Names}}')

# Check each container for inactivity
for container in $containers; do
    # Get the container's last activity time. Adjust this command based on your criteria for inactivity
    last_activity=$(docker inspect --format '{{ .State.StartedAt }}' $container)

    # Convert last activity time and current time to seconds since epoch
    last_activity_sec=$(date --date="$last_activity" +%s)
    current_sec=$(date +%s)

    # Calculate the difference in seconds
    difference=$((current_sec - last_activity_sec))

    # Check if the difference is greater than the inactivity threshold
    if [ $difference -gt $INACTIVITY_THRESHOLD ]; then
        echo "Container $container has been inactive for more than 5 minutes."
        # Add your command to handle the inactive container, e.g., stop or remove the container
        # docker stop $container
    fi
done
