FROM alpine:3.18

RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

RUN adduser -D pocketbase

RUN echo "pocketbase:password" | chpasswd

EXPOSE 8090

WORKDIR /home/pocketbase
COPY ./pocketbase .
COPY ./marmot .
COPY ./marmot-reset.sh .
COPY ./marmot-snapshot.sh .
COPY ./marmot-start.sh .
COPY ./marmot-restart.sh .
COPY ./start.sh .
CMD "./start.sh"

