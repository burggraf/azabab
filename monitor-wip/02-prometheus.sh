#!/bin/bash
if [ -z "$1" ]
  then
    echo "syntax: ./install_prometheus.sh <host-name>"
    echo "example: ./install_prometheus.sh west-1.azabab.com"
    exit 1
fi
USER="ubuntu@$1"

echo "*** Installing and Configuring Prometheus on Ubuntu 23.04 ***"

# Update and upgrade the system
ssh $USER "sudo apt update && sudo apt upgrade -y"

# Install dependencies
ssh $USER "sudo apt install curl wget -y"

# Download Prometheus
ssh $USER "wget https://github.com/prometheus/prometheus/releases/download/v2.39.1/prometheus-2.39.1.linux-amd64.tar.gz"

# Extract files and move to /usr/local/bin
ssh $USER "tar -xzf prometheus-*.linux-amd64.tar.gz"
ssh $USER "sudo mv prometheus-*.linux-amd64/prometheus /usr/local/bin/"
ssh $USER "sudo mv prometheus-*.linux-amd64/promtool /usr/local/bin/"

# Create user and directories for Prometheus
ssh $USER "sudo useradd --no-create-home --shell /bin/false prometheus"
ssh $USER "sudo mkdir /etc/prometheus"
ssh $USER "sudo mkdir /var/lib/prometheus"
ssh $USER "sudo chown prometheus:prometheus /etc/prometheus"
ssh $USER "sudo chown prometheus:prometheus /var/lib/prometheus"

# Move configuration files and set permissions
ssh $USER "sudo mv prometheus-*.linux-amd64/consoles /etc/prometheus"
ssh $USER "sudo mv prometheus-*.linux-amd64/console_libraries /etc/prometheus"
ssh $USER "sudo mv prometheus-*.linux-amd64/prometheus.yml /etc/prometheus/prometheus.yml"
ssh $USER "sudo chown -R prometheus:prometheus /etc/prometheus/consoles"
ssh $USER "sudo chown -R prometheus:prometheus /etc/prometheus/console_libraries"
ssh $USER "sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml"

# Clean up
ssh $USER "rm -rf prometheus-*.linux-amd64.tar.gz prometheus-*.linux-amd64"

# Create a Prometheus service file

ssh $USER "sudo echo \"[Unit]\" >> prometheus.service"
ssh $USER "sudo echo \"Description=Prometheus\" >> prometheus.service"
ssh $USER "sudo echo \"Wants=network-online.target\" >> prometheus.service"
ssh $USER "sudo echo \"After=network-online.target\" >> prometheus.service"
ssh $USER "sudo echo \"[Service]\" >> prometheus.service"
ssh $USER "sudo echo \"User=prometheus\" >> prometheus.service"
ssh $USER "sudo echo \"Group=prometheus\" >> prometheus.service"
ssh $USER "sudo echo \"Type=simple\" >> prometheus.service"
ssh $USER "sudo echo \"ExecStart=/usr/local/bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/var/lib/prometheus --web.console.templates=/etc/prometheus/consoles --web.console.libraries=/etc/prometheus/console_libraries\" >> prometheus.service"
ssh $USER "sudo echo \"[Install]\" >> prometheus.service"
ssh $USER "sudo echo \"WantedBy=multi-user.target\" >> prometheus.service"
ssh $USER "sudo mv prometheus.service /etc/systemd/system/"

# Reload systemd and start Prometheus
ssh $USER "sudo systemctl daemon-reload"
ssh $USER "sudo systemctl start prometheus"
ssh $USER "sudo systemctl enable prometheus"

echo "*** Prometheus installation and configuration complete ***"
