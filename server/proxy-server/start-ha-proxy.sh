sudo docker run \
    -d --name proxy \
    -v /home/ubuntu/proxy:/cfg \
    -p 80:80 \
    -p 443:443 \
    -p 9000:9000 \
    proxy
    


#docker run -d --name my-haproxy-container -p 80:80 -p 443:443 my-haproxy-image
