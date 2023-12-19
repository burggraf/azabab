// use hyper::{Request, Response, Body, StatusCode, client::Client};
// use std::process::Command;
use hyper::{Body, Client, Request, Response, Uri};

//use shiplift::{ContainerOptions, Docker, PullOptions, builder::VolumeBind};
// use tokio::time::{sleep, Duration};
//use std::env;
use shiplift::{ContainerOptions, Docker};
use tokio::time::{interval, Duration};
//use shiplift::rep::ContainerDetails;

pub async fn handle_catch_all(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
            // Clone header values before mutating `req`                
            // let original_port = req.headers().get("X-Original-Port").unwrap().to_str().unwrap().to_owned();
            // let original_uri = req.headers().get("X-Original-URI").unwrap().to_str().unwrap().to_owned();
            let original_port = req.headers().get("X-Original-Port").unwrap().to_str().unwrap().to_string();
            let original_uri = req.headers().get("X-Original-URI").unwrap().to_str().unwrap().to_string();
        

                // Docker interaction
    let docker = Docker::new();
    //let current_dir = env::current_dir().unwrap();
    let base_path = "/home/ubuntu";
    let volume_mounts = vec![
        format!("{}/data/{}/pb_data:/home/pocketbase/pb_data", base_path, original_port),
        format!("{}/data/{}/pb_public:/home/pocketbase/pb_public", base_path, original_port),
        format!("{}/data/{}/pb_migrations:/home/pocketbase/pb_migrations", base_path, original_port),
        format!("{}/data/{}/pb_hooks:/home/pocketbase/pb_hooks", base_path, original_port),
    ];
    let container_options = ContainerOptions::builder("pbdocker")
    .name(&original_port)
    .cpus(0.25)
    .memory(96 * 1024 * 1024) // Memory in bytes
    .expose(8090, "tcp", original_port.parse::<u32>().unwrap())
    .volumes(volume_mounts.iter().map(AsRef::as_ref).collect::<Vec<&str>>())
    .auto_remove(true)
    .build();

    let container = docker.containers().create(&container_options).await.unwrap();
    let _ = docker.containers().get(&container.id).start().await.unwrap();

    // Optional: Check container's status or wait for it to be ready
    // e.g., sleep(Duration::from_millis(500)).await;

    //let server_uri = format!("http://localhost:8090/invalid-page");
    let server_uri = format!("http://localhost:{}/invalid-page", original_port);

    let client = Client::new();
    let mut interval = interval(Duration::from_millis(50));
    let mut server_ready = false;
    
    for _ in 0..200 { // attempts 20 times at a 500ms interval
        interval.tick().await;
        match client.get(Uri::try_from(server_uri.as_str()).unwrap()).await {
            Ok(response) => {
                if response.status() == hyper::StatusCode::NOT_FOUND {
                    // Server is up and responding with 404 for the invalid page
                    server_ready = true;
                    break;
                }
            }
            Err(_e) => {
                // Handle connection errors (e.g., server not ready yet)
                //eprintln!("Error connecting to server: {}", e);
            }
        }
    }
    
    if !server_ready {
        eprintln!("Server did not start in expected time");
        // Handle this situation appropriately
    }




            let method = req.method().clone();
            let headers = req.headers().clone();

            let entire_body = hyper::body::to_bytes(req.body_mut()).await?;

            // Create a client and make a request to the original_uri
            let client = Client::new();
            let forward_uri = format!("http://localhost:{}{}", &original_port, &original_uri);

            let mut forward_req_builder = Request::builder()
                .method(method)
                .uri(forward_uri);

            // Apply the cloned headers to the new request
            for (key, value) in headers.iter() {
                forward_req_builder = forward_req_builder.header(key, value);
            }

            let forward_req = forward_req_builder
                .body(Body::from(entire_body))
                .unwrap();

            let resp = client.request(forward_req).await?;

            Ok(resp)
}
