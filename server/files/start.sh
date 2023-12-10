./pocketbase serve --http 0.0.0.0:8090 > log.txt 2>&1 &
wait -n
exit $?
