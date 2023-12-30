sudo cat /home/ubuntu/sync-server/*.config > /home/ubuntu/sync-server/lsyncd.conf.lua
sudo docker exec -it sync-server sh -c ./restart-sync-server.sh
