sudo ./marmot -config config.toml \
    -cluster-addr west-2.azabab.com:4002 \
    -cluster-peers 'nats://west-1.azabab.com:4001/','nats://west-3.azabab.com:4003'
