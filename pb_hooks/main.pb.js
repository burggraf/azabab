routerAdd("POST", "/createproject", async (c) => {
    // read the body via the cached request object
    // (this method is commonly used in hook handlers because it allows reading the body more than once)
    const data = $apis.requestInfo(c).data

    const info   = $apis.requestInfo(c);
    // const admin  = info.admin;      // empty if not authenticated as admin
    const user = info.authRecord; // empty if not authenticated as regular auth record
    // console.log('info', JSON.stringify(info, null, 2));
    // console.log('admin', JSON.stringify(admin, null, 2));
    if (!user) {
        return c.json(401, { "error": "not logged in" })    
    }
    if (data?.project?.owner !== user?.id) {
        return c.json(401, { "error": "not your project" })
    }
    // create the project record
    const projectInsert = arrayOf(new DynamicModel({
        "id": "",
    }))
    $app.dao().db()
        .newQuery(`insert into projects (name, owner, ownertype, domain) 
                    values ('${data?.project?.name}', '${data?.project?.owner}', '${data?.project?.ownertype}', '${data?.project?.domain}')
                    returning id`)
        .all(projectInsert) // throw an error on db failure
    // get the id of the newly inserted project
    const newId = projectInsert[0].id;
    // create the project_instances record
    const project_instancesInsert = arrayOf(new DynamicModel({
        "port": 0
    }))
    $app.dao().db()
        .newQuery(`insert into project_instance (project_id, site_id, port, type, domain) 
                    values ('${newId}', 
                    '${data?.project_instances[0]?.id}', 
                    (select coalesce((select max(port)+1 FROM project_instance where site_id = '${data?.project_instances[0]?.id}'),10001)),
                    '${data?.project_instances[0]?.type}',
                    '${data?.project?.domain}')
                    returning port`)
        .all(project_instancesInsert) // throw an error on db failure

    const newPort = project_instancesInsert[0].port;
    // now use (data?.project?.domain) and (newPort) to create the nginx config file
    
    return c.json(200, { "result": "ok" })    

})

routerAdd("GET", "/test", async (c) => {
    console.log('** ls');
    try {

        const domains = arrayOf(new DynamicModel({
            // describe the shape of the data (used also as initial values)
            "domain":     "",
            "port": 0,
        }))
        
        $app.dao().db()
            .newQuery("SELECT domain, port FROM domain_mappings")
            .all(domains) // throw an error on db failure

        console.log('domains', JSON.stringify(domains, null, 2));        

        const cmd = $os.cmd('ssh', 'ubuntu@west-2.azabab.com', 'ls')
        // const error = String.fromCharCode(...cmd.stderr());
        console.log(JSON.stringify(cmd, null, 2));
        const output = String.fromCharCode(...cmd.output());
        console.log('output', output);
        return c.json(200, { "result": output })    
    } catch (err) {
        console.log('err', err);
        const cmd = $os.cmd('ls', '-alt')
        return c.json(200, { "got err": JSON.stringify(err) })    
    }
});
routerAdd("GET", "/hello/:name", (c) => {
    let name = c.pathParam("name")

    return c.json(200, { "message": "Hello " + name })
})
routerAdd("GET", "/sample_hook", (c) => {    
    // let name = c.pathParam("name")
    function randomString() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 15; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    };
    
    const result = new DynamicModel({
        a:"",b:"",c:"",category:"",d:"",difficulty:"",id:"",question:"",subcategory:""
    })

    try {
        const user = c.get("authRecord") // empty if not authenticated as regular auth record    
        if (user === null) {
            console.log("user is null")
            try {
                $app.dao().db()
                .newQuery(`SELECT trivia.a,trivia.b,trivia.c,trivia.d,trivia.category,trivia.difficulty,trivia.subcategory,trivia.id,trivia.question FROM trivia where trivia.id >= '${randomString()}' order by trivia.id asc LIMIT 1`)
                .one(result) // throw an error on db failure or missing row
            } catch (forwarderror) {
                console.log("forwarderror:", forwarderror)
                try {
                    if (forwarderror.value.error() === 'sql: no rows in result set') {
                        $app.dao().db()
                        .newQuery(`SELECT trivia.a,trivia.b,trivia.c,trivia.d,trivia.category,trivia.difficulty,trivia.subcategory,trivia.id,trivia.question FROM trivia where trivia.id <= '${randomString()}' order by trivia.id asc LIMIT 1`)
                        .one(result) // throw an error on db failure or missing row
                    }    
                } catch (finalerror) {
                    console.log("finalerror:", finalerror)
                    return c.json(200, { "error": finalerror })
                }
            }    
        } else {
            console.log("user is: ", user?.id)
            try {
                $app.dao().db()
                .newQuery(`SELECT trivia.a,trivia.b,trivia.c,trivia.d,trivia.category,trivia.difficulty,trivia.subcategory,trivia.id,trivia.question FROM trivia left outer join trivia_log on trivia_log.user = '${user?.id}' and trivia_log.question = trivia.id where trivia.id >= '${randomString()}' and trivia_log.id is null order by trivia.id asc LIMIT 1`)
                .one(result) // throw an error on db failure or missing row
            } catch (forwarderror) {
                console.log("forwarderror:", forwarderror)
                try {
                    if (forwarderror.value.error() === 'sql: no rows in result set') {
                        $app.dao().db()
                        .newQuery(`SELECT trivia.a,trivia.b,trivia.c,trivia.d,trivia.category,trivia.difficulty,trivia.subcategory,trivia.id,trivia.question FROM trivia left outer join trivia_log on trivia_log.user = '${user?.id}' and trivia_log.question = trivia.id where trivia.id <= '${randomString()}' and trivia_log.id is null order by trivia.id asc LIMIT 1`)
                        .one(result) // throw an error on db failure or missing row
                    }    
                } catch (finalerror) {
                    console.log("finalerror:", finalerror)
                    return c.json(200, { "error": finalerror })
                }
            }
    
        }        
        return c.json(200, { result })
    } catch (err) {
        console.log("err:", err)
        return c.json(200, { "error": err })
    }


}, /* optional middlewares */)


// fires only for "users" (not) "managers" auth collections
// onRecordAfterConfirmVerificationRequest((e) => {
//     console.log('onRecordAfterConfirmVerificationRequest: e.httpContext',JSON.stringify(e.httpContext,null,2))
//     console.log('onRecordAfterConfirmVerificationRequest: e.record',JSON.stringify(e.record,null,2))
//     // e.redirect(200, "http://localhost:8100/welcome");
// }, "users")


onRealtimeConnectRequest((e) => {
    ////console.log('onRealtimeConnectRequest', JSON.stringify(e,null,2))
    // for (let attr in e.httpContext) {
    //     console.log(`httpContext.${attr} = ${e.httpContext[attr]}`)
    // }
/*
2023/12/02 08:07:03 client.channel = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.discard = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.get = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.hasSubscription = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.id = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.isDiscarded = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.send = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.set = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.subscribe = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.subscriptions = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.unset = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.unsubscribe = function reflect.methodValueCall() { [native code] }

2023/12/02 08:20:08 httpContext.attachment = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.bind = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.blob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.cookie = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.cookies = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.echo = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.error = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.file = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.fileFS = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.formFile = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.formValue = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.formValueDefault = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.formValues = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.get = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.html = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.htmlBlob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.inline = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.isTLS = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.isWebSocket = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.json = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.jsonBlob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.jsonp = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.jsonpBlob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.jsonPretty = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.multipartForm = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.noContent = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.path = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.pathParam = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.pathParamDefault = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.pathParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.queryParam = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.queryParamDefault = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.queryParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.queryString = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.rawPathParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.realIP = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.redirect = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.render = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.request = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.reset = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.response = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.routeInfo = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.scheme = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.set = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setCookie = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setPath = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setPathParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setRawPathParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setRequest = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setResponse = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setRouteInfo = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.stream = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.string = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.validate = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.xml = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.xmlBlob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.xmlPretty = function reflect.methodValueCall() { [native code] }


*/

})

onRealtimeDisconnectRequest((e) => {
    ////console.log('onRealtimeDisconnectRequest', JSON.stringify(e,null,2))
})
