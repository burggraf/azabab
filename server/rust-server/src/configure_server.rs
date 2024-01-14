use hyper::{Request, Response, Body, StatusCode};
use serde::Deserialize;
use std::process::Command;
use tokio::fs::{self, File};
use tokio::io::AsyncWriteExt;

#[derive(Deserialize)]
struct ConfigData {
    rclone_conf: String,
    nats_server_conf: String,
}

pub async fn handle_configure_server(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    println!("handle_configure_server");

    // Parse request body
    let body_bytes = hyper::body::to_bytes(req.body_mut()).await?;
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    let config_data: ConfigData = serde_json::from_str(&body_str).unwrap();

    // Process rclone_conf
    println!("Process rclone_conf");
    let rclone_dir = "/root/.config/rclone";
    fs::create_dir_all(rclone_dir).await.unwrap();
    let rclone_file_path = format!("{}/rclone.conf", rclone_dir);
    let mut rclone_file = File::create(&rclone_file_path).await.unwrap();
    rclone_file.write_all(config_data.rclone_conf.as_bytes()).await.unwrap();

    // Process nats_server_conf
    println!("Process nats_server_conf");
    let nats_server_dir = "/home/ubuntu/nats-server";
    fs::create_dir_all(nats_server_dir).await.unwrap();
    let nats_server_file_path = format!("{}/nats-server.conf", nats_server_dir);
    let mut nats_server_file = File::create(&nats_server_file_path).await.unwrap();
    nats_server_file.write_all(config_data.nats_server_conf.as_bytes()).await.unwrap();
    
    println!("Configuration updated successfully");
    println!("start-nats-server.sh, restart-nats-server.sh");

    let start_command = "/home/ubuntu/start-nats-server.sh";
    let _start_command = Command::new("sh")
        .arg("-c")
        .arg(start_command)
        .output()
        .unwrap();
    let restart_command = "/home/ubuntu/restart-nats-server.sh";
    let _restart_command = Command::new("sh")
        .arg("-c")
        .arg(restart_command)
        .output()
        .unwrap();
    
    // Return response
    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(Body::from("Configuration updated successfully"))
        .unwrap())
}
