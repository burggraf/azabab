# check if argument is empty
# check for two arguments
if [ -z "$1" ] || [ -z "$2" ]
  then
    echo "syntax: ./install.sh <host-name> <domain-name>"
    echo "example: ./install.sh west-1.azabab.com azabab.com"
    exit 1
fi

echo ""
echo "Copy ssh-server files to the server"
echo ""
ssh ubuntu@$1 "mkdir ~/ssh-server"
scp ssh-server/* ubuntu@$1:~/ssh-server

echo ""
echo "*** Build the Docker image ***"
echo ""
ssh ubuntu@$1 "cd ~/ssh-server;sudo docker build -t ssh-server ."
scp files/start-ssh-server.sh ubuntu@$1:~
ssh ubuntu@$1 "~/start-ssh-server.sh"

