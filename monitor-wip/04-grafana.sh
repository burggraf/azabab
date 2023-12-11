#!/bin/bash
if [ -z "$1" ]
  then
    echo "syntax: ./install_grafana.sh <host-name>"
    echo "example: ./install_grafana.sh west-1.azabab.com"
    exit 1
fi
USER="ubuntu@$1"

echo "*** Installing Grafana on Ubuntu 23.04 ***"

# Update and upgrade the system
ssh $USER "sudo apt update && sudo apt upgrade -y"

# Install prerequisites
ssh $USER "sudo apt install -y software-properties-common"

# Add Grafana's repository
ssh $USER "sudo add-apt-repository \"deb https://packages.grafana.com/oss/deb stable main\""
ssh $USER "wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -"

# Update repositories after adding Grafana's repository
ssh $USER "sudo apt update"

# Install Grafana
ssh $USER "sudo apt install grafana -y"

# Enable and start Grafana service
ssh $USER "sudo systemctl enable grafana-server"
ssh $USER "sudo systemctl start grafana-server"

echo "*** Grafana installation complete ***"
