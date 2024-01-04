use hyper::{Body, Client, Request, Response, Uri, body::to_bytes};
use shiplift::{ContainerOptions, Docker};
use tokio::time::{interval, Duration};
use serde_json::Value; // Add serde_json to your Cargo.toml dependencies
use std::env; // Import the env module

pub async fn handle_catch_all(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    // Clone header values before mutating `req`
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
        format!("{}/data/{}/marmot:/marmot", base_path, original_port),
    ];
    // Retrieve the ENVIRONMENT variable from the Rust application's environment
    let environment_variable = env::var("ENVIRONMENT").unwrap_or_else(|_| "default_value".to_string());
    let container_options = ContainerOptions::builder("pbdocker")
        .name(&original_port)
        .cpus(0.50)
        .memory(256 * 1024 * 1024) // Memory in bytes
        .expose(8090, "tcp", original_port.parse::<u32>().unwrap())
        .volumes(volume_mounts.iter().map(AsRef::as_ref).collect::<Vec<&str>>())
        .env(vec![&format!("ENVIRONMENT={}", environment_variable)]) // Set the environment variable
        .auto_remove(true)
        .build();
  
    let container = docker.containers().create(&container_options).await.unwrap();
    let _ = docker.containers().get(&container.id).start().await.unwrap();

    let server_uri = format!("http://localhost:{}/api/health", original_port);
    /*
    {
        "code": 200,
        "message": "API is healthy.",
        "data": {
            "canBackup": false
        }
    }
     */
    let client = Client::new();
    let mut interval = interval(Duration::from_millis(50));
    let mut server_ready = false;
    
    for _attempt in 0..200 { // attempts 200 times at a 50ms interval
        interval.tick().await;
        match client.get(Uri::try_from(&server_uri).unwrap()).await {
            Ok(response) => {
                let body = to_bytes(response.into_body()).await.unwrap();
                if let Ok(json) = serde_json::from_slice::<Value>(&body) {
                    if json["code"] == 200 && json["message"] == "API is healthy." {
                        // println!("Server is healthy.");
                        server_ready = true;
                        break;
                    }
                }
            }
            Err(_e) => {
                // Handle connection errors (e.g., server not ready yet)
                // println!("Attempt {}: server not ready yet", attempt);
            }
        }
    }    
    // println!("ready ===========================");
    
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