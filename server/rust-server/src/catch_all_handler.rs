use hyper::{Body, Client, Request, Response, Uri};
use hyper::body::to_bytes;
use shiplift::{ContainerOptions, Docker};
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};
use serde_json::Value;
use std::env;
use std::collections::HashMap;
use std::sync::Arc;

// Global HashMap to store locks for each container creation process.
lazy_static::lazy_static! {
    static ref CONTAINER_CREATION_LOCKS: Arc<Mutex<HashMap<String, Arc<Mutex<()>>>>> = Arc::new(Mutex::new(HashMap::new()));
}

async fn get_or_create_lock(original_port: &str) -> Arc<Mutex<()>> {
    let mut locks = CONTAINER_CREATION_LOCKS.lock().await;
    let lock = locks.entry(original_port.to_string()).or_insert_with(|| Arc::new(Mutex::new(())));
    lock.clone()
}

async fn is_container_created(_original_port: &str) -> bool {
    // Implement logic to check if the container for the given port is already running
    // Placeholder logic; replace with actual implementation
    false
}

pub async fn handle_catch_all(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    // Clone header values before mutating `req`
    let original_port = req.headers().get("X-Original-Port").unwrap().to_str().unwrap().to_string();
    let original_uri = req.headers().get("X-Original-URI").unwrap().to_str().unwrap().to_string();

    // Get or create a lock for the specific container creation process
    let lock = get_or_create_lock(&original_port).await;

    {
        // Acquire the lock. This block will wait here if another request is already creating the container.
        let _guard = lock.lock().await;

        // Check if the container is already created to avoid redundant creation.
        if !is_container_created(&original_port).await {
            // Docker interaction
            let docker = Docker::new();
            let base_path = "/home/ubuntu";
            let volume_mounts = vec![
                    format!("{}/data/{}/pb_data:/home/pocketbase/pb_data", base_path, original_port),
                    format!("{}/data/{}/pb_public:/home/pocketbase/pb_public", base_path, original_port),
                    format!("{}/data/{}/pb_migrations:/home/pocketbase/pb_migrations", base_path, original_port),
                    format!("{}/data/{}/pb_hooks:/home/pocketbase/pb_hooks", base_path, original_port),
                    format!("{}/data/{}/marmot:/marmot", base_path, original_port),
            ];
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

            // Wait for the server to be ready
            let server_uri = format!("http://localhost:{}/api/health", original_port);
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
            if !server_ready {
                eprintln!("Server did not start in expected time");
                // Handle this situation appropriately
            }
        }
    }

    let method = req.method().clone();
    let headers = req.headers().clone();

    let entire_body = to_bytes(req.body_mut()).await?;

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
