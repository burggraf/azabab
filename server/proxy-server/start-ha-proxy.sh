sudo docker run \
    -d --name proxy-server \
    -v /home/ubuntu/proxy-server:/cfg \
    -p 80:80 \
    -p 443:443 \
    -p 9000:9000 \
    -p 5001:5000 \
    proxy-server
