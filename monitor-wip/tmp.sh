#!/bin/bash
if [ -z "$1" ]
  then
    echo "syntax: ./install_prometheus.sh <host-name>"
    echo "example: ./install_prometheus.sh west-1.azabab.com"
    exit 1
fi
USER="ubuntu@$1"
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
