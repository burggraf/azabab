use hyper::{Request, Response, Body, StatusCode};
use serde_json::json;
use std::fs::{OpenOptions, File};
use std::io::{Write, BufReader, BufRead};
use std::process::Command;

use crate::AUTH_TOKEN; // Assuming AUTH_TOKEN is defined elsewhere in your crate

pub async fn handle_remove_project(mut req: Request<Body>, _auth_token: &str) -> Result<Response<Body>, hyper::Error> {
    // Authorization check
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

    let domain = body_params["domain"].as_str().unwrap_or_default();
    let port = body_params["port"].as_str().unwrap_or_default();
    let domain_port_pair = format!("{}    {};", domain, port);
    // println!("Removing domain-port pair: {}", domain_port_pair);

    let file_path = "/etc/nginx/domain_ports.txt";

    // Read and filter the file, handling errors manually
    let file = match File::open(file_path) {
        Ok(file) => file,
        Err(_) => return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::from(json!({ "data": null, "error": "Failed to open file" }).to_string()))
            .unwrap()),
    };

    let reader = BufReader::new(file);
    let lines: Vec<String> = reader.lines()
                                   .filter_map(|line| line.ok())
                                   .filter(|line| *line != domain_port_pair)
                                   .collect();

    // Write the updated data back, handling errors manually
    let mut file = match OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(file_path) {
            Ok(file) => file,
            Err(_) => return Ok(Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::from(json!({ "data": null, "error": "Failed to write to file" }).to_string()))
                .unwrap()),
    };

    for line in lines {
        if writeln!(file, "{}", line).is_err() {
            return Ok(Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::from(json!({ "data": null, "error": "Failed to write to file" }).to_string()))
                .unwrap());
        }
    }

    // Restart Nginx
    let _ = Command::new("sh")
        .arg("-c")
        .arg("sudo kill -HUP $(cat /var/run/nginx.pid)")
        .output();

    // Stop Docker container if it's running
    let _docker_stop_output = Command::new("docker")
        .args(&["stop", "-t", "0", port])
        .output();

    // if let Err(e) = docker_stop_output {
    //     // Log the error but do not fail the operation
    //     eprintln!("Error stopping Docker container: {}", e);
    // }

    // remove the user's data
    
    // Construct the directory path
    let directory_path = format!("/home/ubuntu/data/{}", port);

    // Execute the command to delete the directory
    match Command::new("rm")
        .args(&["-rf", &directory_path])
        .output() {
            Ok(output) => {
                if !output.status.success() {
                    // Handle the case where the directory deletion fails
                    return Ok(Response::builder()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(Body::from(json!({ "data": null, "error": "Failed to delete directory" }).to_string()))
                        .unwrap());
                }
            },
            Err(_) => {
                // Handle the case where the command execution fails
                return Ok(Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body(Body::from(json!({ "data": null, "error": "Failed to execute directory delete command" }).to_string()))
                    .unwrap());
            }
    }

    // Respond with success
    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(json!({ "data": "OK", "error": null }).to_string()))
        .unwrap())

}
