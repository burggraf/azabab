local myRsync = {
	archive = true,
	compress = true,
	rsh = "/usr/bin/ssh -p 22 -o StrictHostKeyChecking=no -i /.ssh/id_rsa"
}

settings {
    logfile = "/var/log/lsyncd.log",
    statusFile = "/var/log/lsyncd-status.log",
    statusInterval = 10,
    nodaemon = false
}

sync {
    source = "/sync-server",
    target = "/sync-server.backup"
}