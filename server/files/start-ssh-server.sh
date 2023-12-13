sudo docker run -d -p 2222:22 \
-v /home/ubuntu/data:/data \
--name ssh-server ssh-server