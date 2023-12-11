#!/bin/bash
# install monitoring server (Zabbix)
if [ -z "$1" ]
  then
    echo "syntax: ./install.sh <host-name>"
    echo "example: ./install.sh west-1.azabab.com"
    exit 1
fi
USER="ubuntu@$1"

echo "*** Install Zabbix Server with PostgreSQL and Nginx on Ubuntu 22.04 ***"

# Update and upgrade the system
ssh $USER "sudo apt update && sudo apt upgrade -y"

# Install PostgreSQL
ssh $USER "sudo apt install postgresql postgresql-contrib -y"
ssh $USER "sudo systemctl start postgresql && sudo systemctl enable postgresql"

# Create Zabbix database and user
ssh $USER "sudo -u postgres psql -c \"CREATE USER zabbix WITH PASSWORD 'zabbix';\""
ssh $USER "sudo -u postgres psql -c \"CREATE DATABASE zabbix OWNER zabbix;\""

# Install Nginx and PHP
ssh $USER "sudo apt install nginx php-fpm php-pgsql php-gd php-xml php-bcmath php-mbstring -y"
ssh $USER "sudo systemctl start nginx && sudo systemctl enable nginx"
ssh $USER "sudo systemctl start php8.1-fpm && sudo systemctl enable php8.1-fpm"

# Add Zabbix repository and install Zabbix
ssh $USER "wget https://repo.zabbix.com/zabbix/6.0/ubuntu/pool/main/z/zabbix-release/zabbix-release_6.0-4+ubuntu22.04_all.deb"
ssh $USER "sudo dpkg -i zabbix-release_6.0-4+ubuntu22.04_all.deb"
ssh $USER "sudo apt update"
ssh $USER "sudo apt install -y zabbix-server-pgsql zabbix-frontend-php php8.1-pgsql zabbix-nginx-conf zabbix-sql-scripts zabbix-agent"

# Configure Zabbix with PostgreSQL
ssh $USER "sudo zcat /usr/share/zabbix-sql-scripts/postgresql/server.sql.gz | sudo -u zabbix psql zabbix"

# Configure PHP for Zabbix
ssh $USER "sudo sed -i 's/; php_value\[date.timezone\] = America\/Los_Angeles/php_value\[date.timezone\] = America\/Los_Angeles/' /etc/zabbix/nginx.conf"

# Start and enable Zabbix server and agent
ssh $USER "sudo systemctl restart zabbix-server zabbix-agent nginx php8.1-fpm"
ssh $USER "sudo systemctl enable zabbix-server zabbix-agent"

echo "*** Zabbix Installation Completed ***"
echo "Access Zabbix web interface at http://your_server_ip_or_domain/zabbix"
