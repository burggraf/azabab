use hyper::{Request, Response, Body, StatusCode};
use serde_json::json;
use std::{fs, process::Command};

use crate::AUTH_TOKEN;

pub async fn handle_setup_folder_sync(mut req: Request<Body>, _auth_token: &str) -> Result<Response<Body>, hyper::Error> {
    println!("handle_setup_folder_sync");

    // Check for authorization
    if let Some(auth_header) = req.headers().get(hyper::header::AUTHORIZATION) {
        if auth_header != AUTH_TOKEN {
            return Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .body(Body::from(json!({ "data": null, "error": "Unauthorized" }).to_string()))
                .unwrap());
        }
    } else {
        return Ok(Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .body(Body::from(json!({ "data": null, "error": "No Authorization Header" }).to_string()))
            .unwrap());
    }

    // Parse request body
    let body_bytes = hyper::body::to_bytes(req.body_mut()).await?;
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    let body_params: serde_json::Value = serde_json::from_str(&body_str).unwrap();

    let port = body_params["port"].as_str().unwrap_or_default();
    let config_file = body_params["config_file"].as_str().unwrap_or_default();
    println!("port: {}", port);
    println!("config_file: {}", config_file);


    let config_path = format!("/home/ubuntu/sync-server/{}.config", port);
    println!("config_path: {}", config_path);

    // Step 1: Delete the file if it exists
    if fs::metadata(&config_path).is_ok() {
        fs::remove_file(&config_path).unwrap();
    }

    println!("step 1 complete");

    // Step 2: If config_file is not empty, create the file
    if !config_file.is_empty() {
        fs::write(&config_path, config_file).unwrap();
    }
    println!("step 2 complete");

    // Step 3: Execute the command to restart the sync server
    Command::new("sh")
        .arg("-c")
        .arg("/home/ubuntu/restart-sync-server.sh")
        .output()
        .expect("Failed to execute command");
    
    println!("step 3 complete");

    // Return success response
    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(json!({ "data": "Folder sync setup complete", "error": null }).to_string()))
        .unwrap())
}
