# check if argument is empty
# check for two arguments
if [ -z "$1" ] || [ -z "$2" ]
  then
    echo "syntax: ./install.sh <host-name> <domain-name>"
    echo "example: ./install.sh west-1.azabab.com azabab.com"
    exit 1
fi
scp -r files/nginx.conf ubuntu@$1:~/

ssh ubuntu@$1 "sudo touch /etc/nginx/domain_pb_version.txt"
ssh ubuntu@$1 "sudo chmod 644 /etc/nginx/domain_pb_version.txt"
ssh ubuntu@$1 "sudo chown ubuntu:ubuntu /etc/nginx/domain_pb_version.txt"

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
echo "Test nginx"
echo ""
# ssh ubuntu@$1 "sudo kill -HUP $(cat /var/run/nginx.pid)"
ssh ubuntu@$1  "sudo nginx -t"

echo ""
echo "Reload nginx"
echo ""
# ssh ubuntu@$1 "sudo kill -HUP $(cat /var/run/nginx.pid)"
ssh ubuntu@$1  "sudo kill -HUP \$(cat /var/run/nginx.pid)"
