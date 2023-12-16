# check if argument is empty
# check for two arguments
if [ -z "$1" ] || [ -z "$2" ]
  then
    echo "syntax: ./install.sh <host-name> <domain-name>"
    echo "example: ./install.sh west-1.azabab.com azabab.com"
    exit 1
fi

if [ ! -f "./private/cloudflare.ini" ]; then
    echo "cloudflare.ini file not found!"
    echo "Please create a ./private/cloudflare.ini file with the following format:"
    echo "dns_cloudflare_email = user@host.com"
    echo "dns_cloudflare_api_key = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

echo ""
echo "*** Install Docker ***"
echo ""

ssh ubuntu@$1 "sudo apt update"
ssh ubuntu@$1 "sudo apt install -y apt-transport-https ca-certificates curl software-properties-common"
ssh ubuntu@$1 "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -"
ssh ubuntu@$1 "sudo add-apt-repository \"deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable\""
ssh ubuntu@$1 "apt-cache policy docker-ce"
ssh ubuntu@$1 "sudo apt install -y docker-ce"
ssh ubuntu@$1 "sudo systemctl status docker"

echo ""
echo "*** Install Wildcard SSL Certificate ***"
echo ""
echo "Installing certbot"
ssh ubuntu@$1 "sudo apt install -y certbot python3-certbot-nginx python3-certbot-dns-cloudflare"

echo ""
echo "Request Wildcard SSL Certificate"
echo ""
scp ./private/cloudflare.ini ubuntu@$1:~
ssh ubuntu@$1 "sudo certbot certonly --non-interactive --email support@$1 --agree-tos --dns-cloudflare --dns-cloudflare-credentials ./cloudflare.ini -d \"*.$2\""

echo ""
echo "Copy all necessary files to the server"
echo ""
scp files/* ubuntu@$1:~/

echo ""
echo "Configuring Nginx"
echo ""
ssh ubuntu@$1 "sudo mv ~/options-ssl-nginx.conf /etc/letsencrypt"
ssh ubuntu@$1 "sudo chmod 644 /etc/letsencrypt/options-ssl-nginx.conf"
ssh ubuntu@$1 "sudo chown root:root /etc/letsencrypt/options-ssl-nginx.conf"
ssh ubuntu@$1 "sudo touch /etc/nginx/domain_ports.shm"
ssh ubuntu@$1 "sudo chmod 644 /etc/nginx/domain_ports.shm"
ssh ubuntu@$1 "sudo chown root:root /etc/nginx/domain_ports.shm"
ssh ubuntu@$1 "sudo touch /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo chmod 644 /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo chown ubuntu:ubuntu /etc/nginx/domain_ports.txt"

# Escape dots in the domain for the second replacement

# Replace [DOMAIN] with the provided domain
ssh ubuntu@$1 "sed -i \"s/\[DOMAIN\]/$2/g\" ~/nginx.conf"
# Replace [DOMAIN-WITH-DOTS-ESCAPED] with the escaped domain
#ssh ubuntu@$1 "ESCAPED_DOMAIN=\$(echo $2 | sed 's/\./\\./g');sed -i \"s/\[DOMAIN-WITH-DOTS-ESCAPED\]/$ESCAPED_DOMAIN/g\" ~/nginx.conf"
# Escape dots in the domain for the second replacement
ESCAPED_DOMAIN=$(echo $2 | sed 's/\./\\\\./g')
#ssh ubuntu@$1 'ESCAPED_DOMAIN=$(echo '"$2"' | sed "s/\./\\\./g"); sed -i "s/\[DOMAIN-WITH-DOTS-ESCAPED\]/$ESCAPED_DOMAIN/g" ~/nginx.conf'
ssh ubuntu@$1 "sed -i 's/\[DOMAIN-WITH-DOTS-ESCAPED\]/$ESCAPED_DOMAIN/g' ~/nginx.conf"

ssh ubuntu@$1 "sudo mv ~/nginx.conf /etc/nginx"
ssh ubuntu@$1 "sudo chmod 644 /etc/nginx/nginx.conf"
ssh ubuntu@$1 "sudo chown root:root /etc/nginx/nginx.conf"

echo ""
echo "Add cron job to renew SSL certificate"
echo "Add cron job to stop inactive containers (inactive for 5 minutes)"
echo "Add cron job to collect container stats every minute"
echo ""
ssh ubuntu@$1 "echo \"0 */12 * * * /usr/bin/certbot renew --quiet\" | sudo tee -a /var/spool/cron/crontabs/root"
ssh ubuntu@$1 "echo \"* * * * * /home/ubuntu/stop_inactive_containers.sh\" | sudo tee -a /var/spool/cron/crontabs/root"
ssh ubuntu@$1 "echo \"* * * * * /home/ubuntu/stats.sh\" | sudo tee -a /var/spool/cron/crontabs/root"
ssh ubuntu@$1 "mkdir -p /home/ubuntu/stats"
ssh ubuntu@$1 "sudo chmod 600 /var/spool/cron/crontabs/root"
ssh ubuntu@$1 "sudo chown root:crontab /var/spool/cron/crontabs/root"

echo ""
echo "*** Build the Docker image ***"
echo ""
ssh ubuntu@$1 "sudo docker build -t pbdocker ."

echo ""
echo "Create a service to run rust-server.exe"
echo ""
ssh ubuntu@$1 "sudo mv ~/rust-server.service /etc/systemd/system"
ssh ubuntu@$1 "sudo chmod 644 /etc/systemd/system/rust-server.service"
ssh ubuntu@$1 "sudo chown root:root /etc/systemd/system/rust-server.service"
ssh ubuntu@$1 "sudo systemctl enable rust-server.service"
ssh ubuntu@$1 "sudo systemctl start rust-server.service"

echo ""
echo "Create a service to monitor container startups"
echo ""
ssh ubuntu@$1 "sudo mv ~/monitor-container-startups.service /etc/systemd/system"
ssh ubuntu@$1 "sudo chmod 644 /etc/systemd/system/monitor-container-startups.service"
ssh ubuntu@$1 "sudo chown root:root /etc/systemd/system/monitor-container-startups.service"
ssh ubuntu@$1 "sudo systemctl enable monitor-container-startups.service"
ssh ubuntu@$1 "sudo systemctl start monitor-container-startups.service"

echo ""
echo "Create a service to start the ssh-server"
echo ""
ssh ubuntu@$1 "sudo mv ~/ssh-server.service /etc/systemd/system"
ssh ubuntu@$1 "sudo chmod 644 /etc/systemd/system/ssh-server.service"
ssh ubuntu@$1 "sudo chown root:root /etc/systemd/system/ssh-server.service"
ssh ubuntu@$1 "sudo systemctl enable ssh-server.service"
ssh ubuntu@$1 "sudo systemctl start ssh-server.service"

echo ""
echo "Seed the /etc/nginx/domain_ports.txt file" 
echo ""
ssh ubuntu@$1 "sudo echo \"a.$2  10001;\" >> /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo echo \"b.$2  10002;\" >> /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo echo \"c.$2  10003;\" >> /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo echo \"d.$2  10004;\" >> /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo echo \"e.$2  10005;\" >> /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo echo \"f.$2  10006;\" >> /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo echo \"g.$2  10007;\" >> /etc/nginx/domain_ports.txt"
ssh ubuntu@$1 "sudo echo \"h.$2  10008;\" >> /etc/nginx/domain_ports.txt"

echo ""
echo "Reload the domain_ports.txt file without restarting nginx"
echo ""
# ssh ubuntu@$1 "sudo kill -HUP $(cat /var/run/nginx.pid)"
ssh ubuntu@$1  "sudo kill -HUP \$(cat /var/run/nginx.pid)"

echo ""
echo "Reload the cron scheduler"
echo ""
ssh ubuntu@$1 "sudo service cron reload"
ssh ubuntu@$1 "sudo crontab -l"

echo ""
echo "Copy ssh-server files to the server"
echo ""
ssh ubuntu@$1 "mkdir ~/ssh-server"
scp ssh-server/* ubuntu@$1:~/ssh-server

echo ""
echo "*** Build the ssh-server Docker image ***"
echo ""
ssh ubuntu@$1 "cd ~/ssh-server;sudo docker build -t ssh-server ."
scp files/start-ssh-server.sh ubuntu@$1:~
ssh ubuntu@$1 "~/start-ssh-server.sh"

echo ""
echo "Install Litestream"
echo ""
ssh ubuntu@$1 "sudo dpkg -i litestream-v0.3.9-linux-amd64.deb"
ssh ubuntu@$1 "sudo systemctl enable litestream"
ssh ubuntu@$1 "sudo systemctl start litestream"

echo ""
echo "************"
echo "*** DONE ***"
echo "************"
echo ""

