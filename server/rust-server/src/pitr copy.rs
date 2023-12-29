use hyper::{Request, Response, Body, StatusCode};
use serde::{Deserialize};
use serde_json::json;
use std::process::Command;
use std::str;

#[derive(Deserialize)]
struct PITRData {
    port: String,
    timestamp: String,
    db: String,
    mode: String,
}

pub async fn handle_pitr(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    // Parse request body
    let body_bytes = hyper::body::to_bytes(req.body_mut()).await?;
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    let pitr_data: PITRData = serde_json::from_str(&body_str).unwrap();

    // Process the timestamp to create a destination string
    let destination = pitr_data.timestamp.replace(":", "-");

    // First command: litestream restore
    let restore_command = format!(
        "litestream restore -o /home/ubuntu/data/{}/pb_data/backups/{}/{}.db -timestamp {} /home/ubuntu/data/{}/pb_data/{}.db",
        pitr_data.port, destination, pitr_data.db, pitr_data.timestamp, pitr_data.port, pitr_data.db
    );

    let restore_output = Command::new("sh")
        .arg("-c")
        .arg(&restore_command)
        .output()
        .expect("Failed to execute restore command");

    if !restore_output.status.success() {
        let error_message = str::from_utf8(&restore_output.stderr).unwrap_or("Unknown error occurred");
        return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::from(json!({ "data": null, "error": error_message }).to_string()))
            .unwrap());
    }

    // Second command: zip
    let zip_command = format!(
        "zip -j -m /home/ubuntu/data/{}/pb_data/backups/{}/{}.zip /home/ubuntu/data/{}/pb_data/backups/{}/{}.db",
        pitr_data.port, destination, pitr_data.db, pitr_data.port, destination, pitr_data.db
    );

    let zip_output = Command::new("sh")
        .arg("-c")
        .arg(&zip_command)
        .output()
        .expect("Failed to execute zip command");

    if !zip_output.status.success() {
        let error_message = str::from_utf8(&zip_output.stderr).unwrap_or("Unknown error occurred");
        return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::from(json!({ "data": null, "error": error_message }).to_string()))
            .unwrap());
    }

    // Return successful response
    let response_data = format!("{}-{}.zip", destination, pitr_data.db);
    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(json!({ "data": response_data, "error": null }).to_string()))
        .unwrap())
}
