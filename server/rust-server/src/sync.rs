use hyper::{Request, Response, Body, StatusCode};
use serde_json::json;
use std::{process::Command};
use std::env;

use crate::AUTH_TOKEN;

pub async fn handle_sync(mut req: Request<Body>, _auth_token: &str) -> Result<Response<Body>, hyper::Error> {
    println!("handle_sync");

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
    let direction = body_params["direction"].as_str().unwrap_or_default();
    let destination = body_params["destination"].as_str().unwrap_or_default();
    println!("sync - port {}, direction {}, destination {}", port, direction, destination);

    // Set current folder
    env::set_current_dir("/home/ubuntu/data").unwrap();

    match direction {
        "up" => {
            // Execute rclone sync for "up" direction
            let sync_command = format!("rclone sync {} {}:azabab/sync/{} --exclude marmot/marmot.toml", port, destination, port);
            println!("sync_command: {}", sync_command);
            Command::new("sh")
                .arg("-c")
                .arg(&sync_command)
                .output()
                .expect("Failed to execute sync command");
            // println!("Sync up executed for port {}", port);
        },
        "down" => {
            // Stop Docker container if it's running
            let _docker_stop_output = Command::new("docker")
                .args(&["stop", "-t", "0", port])
                .output();

            let sync_command = format!("rclone sync {}:azabab/sync/{} {} --exclude marmot/marmot.toml", destination, port, port);
            println!("sync_command: {}", sync_command);
            Command::new("sh")
                .arg("-c")
                .arg(&sync_command)
                .output()
                .expect("Failed to execute sync command");
            // println!("Sync down executed for port {}", port);
        },
        "delete" => {
            // New code for "delete" direction
            let delete_command = format!("rclone delete {}:azabab/sync/{}", destination, port);
            println!("delete_command: {}", delete_command);
            Command::new("sh")
                .arg("-c")
                .arg(&delete_command)
                .output()
                .expect("Failed to execute delete command");
            // println!("Delete executed for port {}", port);
        },        
        _ => println!("Invalid direction: {} for port {}", direction, port),
    }
    println!("Sync operation complete");
    // Return success response
    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(json!({ "data": "Sync operation complete", "error": null }).to_string()))
        .unwrap())
}
