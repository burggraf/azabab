FROM alpine:3.18

RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

RUN adduser -D pocketbase

RUN echo "pocketbase:password" | chpasswd

EXPOSE 8090

WORKDIR /home/pocketbase
# RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.19.4/pocketbase_0.19.4_linux_amd64.zip
# RUN apk add unzip
# RUN unzip pocketbase_0.19.4_linux_amd64.zip
# RUN rm pocketbase_0.19.4_linux_amd64.zip
# RUN rm CHANGELOG.md
# RUN rm LICENSE.md
# RUN wget https://github.com/maxpert/marmot/releases/download/v0.8.7-beta.2/marmot-v0.8.7-beta.2-linux-amd64-static.tar.gz
# RUN gunzip marmot-v0.8.7-beta.2-linux-amd64-static.tar.gz
# RUN tar -xvf marmot-v0.8.7-beta.2-linux-amd64-static.tar
# RUN rm marmot-v0.8.7-beta.2-linux-amd64-static.tar
# RUN rm LICENSE
# RUN rm README.md
# RUN rm config.toml
# RUN rm -r examples
COPY ./pocketbase .
COPY ./marmot .

COPY ./start.sh .
#CMD ["./pocketbase", "serve", "--http", "0.0.0.0:8090"]
CMD "./start.sh"


#CMD ["sh", "-c", "./start.sh"]
