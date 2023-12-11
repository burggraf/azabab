#!/bin/bash
if [ -z "$1" ]
  then
    echo "syntax: ./install_elk_stack.sh <host-name>"
    echo "example: ./install_elk_stack.sh west-1.azabab.com"
    exit 1
fi
USER="ubuntu@$1"

echo "*** Installing ELK Stack on Ubuntu 23.04 ***"

# Update and upgrade the system
ssh $USER "sudo apt update && sudo apt upgrade -y"

# Install Java (required by Elasticsearch and Logstash)
ssh $USER "sudo apt install default-jre -y"

# Add Elasticsearch repository
ssh $USER "wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -"
ssh $USER "sudo sh -c 'echo \"deb https://artifacts.elastic.co/packages/7.x/apt stable main\" > /etc/apt/sources.list.d/elastic-7.x.list'"

# Install Elasticsearch
ssh $USER "sudo apt update"
ssh $USER "sudo apt install elasticsearch -y"

# Start and enable Elasticsearch service
ssh $USER "sudo systemctl enable elasticsearch.service"
ssh $USER "sudo systemctl start elasticsearch.service"

# Install Kibana
ssh $USER "sudo apt install kibana -y"

# Start and enable Kibana service
ssh $USER "sudo systemctl enable kibana.service"
ssh $USER "sudo systemctl start kibana.service"

# Add Logstash repository
ssh $USER "sudo apt install logstash -y"

# Start and enable Logstash service
ssh $USER "sudo systemctl enable logstash.service"
ssh $USER "sudo systemctl start logstash.service"

echo "*** ELK Stack installation complete ***"
