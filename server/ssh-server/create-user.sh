# create-user.sh <username> <port-number>
adduser -D -h /data/$2 $1

# Set password for the user
echo "$1:" | chpasswd
chown root:root /data/$2
chmod 777 /data/$2/pb_*
mkdir -p /data/$2/.ssh
touch /data/$2/.ssh/authorized_keys

# Configure SSHD for SCP/SFTP-only Access
# Look for an entry for this user in sshd_config
FOUND=$(grep "Match User $1\$" /etc/ssh/sshd_config | wc -l)

# Only add the user to sshd_config if they are not found
if [ $FOUND -eq 0 ]; then
    echo "" >> /etc/ssh/sshd_config && \
    echo "Match User $1" >> /etc/ssh/sshd_config && \
    echo "ChrootDirectory /data/$2" >> /etc/ssh/sshd_config
    # Find the PID of sshd
    SSHD_PID=$(pidof /usr/sbin/sshd)

    # Check if SSHD is running
    if [ -n "$SSHD_PID" ]; then
        # Send SIGHUP to SSHD to gracefully reload it
        kill -HUP $SSHD_PID
    else
        # Start SSHD if it's not running
        /usr/sbin/sshd -D -e
    fi
else
    echo "user was already in sshd_confi, skipping"
fi
