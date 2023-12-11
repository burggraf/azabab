#!/bin/bash
if [ -z "$1" ]
  then
    echo "syntax: ./deploy_filebeat.sh <host-name>"
    echo "example: ./deploy_filebeat.sh west-1.azabab.com"
    exit 1
fi
USER="ubuntu@$1"

echo "*** Deploying Filebeat on Ubuntu 23.04 ***"

# Update and upgrade the system
ssh $USER "sudo apt update && sudo apt upgrade -y"

# Download and install Filebeat
ssh $USER "curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.17.1-amd64.deb"
ssh $USER "sudo dpkg -i filebeat-7.17.1-amd64.deb"

# Copy the Filebeat configuration file
ssh $USER "sudo mv /etc/filebeat/filebeat.yml /etc/filebeat/filebeat.yml.bak"
ssh $USER "echo 'filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/*.log
filebeat.config.modules:
  path: \${path.config}/modules.d/*.yml
  reload.enabled: false
setup.template.settings:
  index.number_of_shards: 1
output.logstash:
  hosts: [\"localhost:5044\"]
' | sudo tee /etc/filebeat/filebeat.yml"

# Enable and configure the system module
ssh $USER "sudo filebeat modules enable system"

# Set up Filebeat (this command loads the index template into Elasticsearch and sets up the Kibana dashboards)
ssh $USER "sudo filebeat setup"

# Start and enable Filebeat service
ssh $USER "sudo systemctl start filebeat"
ssh $USER "sudo systemctl enable filebeat"

echo "*** Filebeat deployment complete ***"
