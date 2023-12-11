#!/bin/bash
if [ -z "$1" ]
  then
    echo "syntax: ./install_postgresql.sh <host-name>"
    echo "example: ./install_postgresql.sh west-1.azabab.com"
    exit 1
fi
USER="ubuntu@$1"

echo "*** Installing PostgreSQL on Ubuntu 23.04 ***"

# Update and upgrade the system
ssh $USER "sudo apt update && sudo apt upgrade -y"

# Install PostgreSQL
ssh $USER "sudo apt install postgresql postgresql-contrib -y"
ssh $USER "sudo systemctl start postgresql && sudo systemctl enable postgresql"

# Create databases and users for Prometheus and ELK
ssh $USER "sudo -u postgres psql -c \"CREATE USER prometheus WITH PASSWORD 'prometheus';\""
ssh $USER "sudo -u postgres psql -c \"CREATE DATABASE prometheus OWNER prometheus;\""
ssh $USER "sudo -u postgres psql -c \"CREATE USER elk WITH PASSWORD 'elk';\""
ssh $USER "sudo -u postgres psql -c \"CREATE DATABASE elk OWNER elk;\""

