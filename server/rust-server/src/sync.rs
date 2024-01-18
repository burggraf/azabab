use hyper::{Request, Response, Body, StatusCode};
use serde_json::{json, Value};
use std::{process::Command, env};

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

    let body_bytes = hyper::body::to_bytes(req.body_mut()).await?;
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    let body_params: Value = serde_json::from_str(&body_str).unwrap();

    let port = body_params["port"].as_str().unwrap_or_default();
    let direction = body_params["direction"].as_str().unwrap_or_default();
    let destination = body_params["destination"].as_str().unwrap_or_default();

    // Get the folder parameter, defaulting to "sync" if not provided
    let folder = body_params["folder"].as_str().unwrap_or("sync");

    // Initialize an empty vector for excludes
    let mut excludes = Vec::new();
    // Check if excludes parameter is provided and is an array
    if let Some(ex_array) = body_params.get("excludes").and_then(Value::as_array) {
        // Iterate over the array and collect string values
        excludes = ex_array.iter()
                           .filter_map(|e| e.as_str())
                           .map(|e| format!("--exclude {}", e))
                           .collect();
    }
    let exclude_str = excludes.join(" ");

    env::set_current_dir("/home/ubuntu/data").unwrap();

    match direction {
        "up" | "down" => {
            let sync_command = if direction == "up" {
                format!("rclone sync {} {}:azabab/{}/{} {} --exclude marmot/marmot.toml", port, destination, folder, port, exclude_str)
            } else {
                format!("rclone sync {}:azabab/{}/{} {} {} --exclude marmot/marmot.toml", destination, folder, port, port, exclude_str)
            };

            Command::new("sh")
                .arg("-c")
                .arg(&sync_command)
                .output()
                .expect("Failed to execute sync command");
        },
        "delete" => {
            // New code for "delete" direction
            let delete_command = format!("rclone delete {}:azabab/{}/{}", destination, folder, port);
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

    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(json!({ "data": "Sync operation complete", "error": null }).to_string()))
        .unwrap())
}
