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

pub async fn handle_pitr(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {    // Parse request body
    let body_bytes = hyper::body::to_bytes(req.body_mut()).await?;
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    let pitr_data: PITRData = serde_json::from_str(&body_str).unwrap();

    // Process the timestamp to create a destination string
    let destination = pitr_data.timestamp.replace(":", "-");

    match pitr_data.mode.as_str() {
        "backup-folder" => {
            // Existing logic for "backup-folder" mode
            // Logic for "backup-folder" mode
            if pitr_data.mode == "backup-folder" {
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

                // Return successful response for "backup-folder" mode
                let response_data = format!("{}-{}.zip", destination, pitr_data.db);
                return Ok(Response::builder()
                    .status(StatusCode::OK)
                    .body(Body::from(json!({ "data": response_data, "error": null }).to_string()))
                    .unwrap());
            }
        },
        "backup-overwrite" => {
            // Logic for "backup-overwrite" mode
                // First command: zip
            if pitr_data.mode == "backup-overwrite" {    
                let zip_command = format!(
                    "mkdir -p /home/ubuntu/data/{}/pb_data/backups/{}; zip -j -m /home/ubuntu/data/{}/pb_data/backups/{}/{} /home/ubuntu/data/{}/pb_data/{}*",
                    pitr_data.port, destination, pitr_data.port, destination, pitr_data.db, pitr_data.port, pitr_data.db
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

                // Second command: litestream restore
                let restore_command = format!(
                    "litestream restore -o /home/ubuntu/data/{}/pb_data/{}.db /home/ubuntu/data/{}/pb_data/{}.db",
                    pitr_data.port, pitr_data.db, pitr_data.port, pitr_data.db
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

                // Return successful response for "backup-overwrite" mode
                let response_data = format!("Backup and overwrite operation completed for database: {}", pitr_data.db);
                return Ok(Response::builder()
                    .status(StatusCode::OK)
                    .body(Body::from(json!({ "data": response_data, "error": null }).to_string()))
                    .unwrap());
            }
        },
        "erase-overwrite" => {
            // Logic for "erase-overwrite" mode
                // First command: remove database files
            if pitr_data.mode == "erase-overwrite" {
                let remove_command = format!(
                    "rm /home/ubuntu/data/{}/pb_data/{}*", 
                    pitr_data.port, pitr_data.db
                );

                let remove_output = Command::new("sh")
                    .arg("-c")
                    .arg(&remove_command)
                    .output()
                    .expect("Failed to execute remove command");

                if !remove_output.status.success() {
                    let error_message = str::from_utf8(&remove_output.stderr).unwrap_or("Unknown error occurred");
                    return Ok(Response::builder()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(Body::from(json!({ "data": null, "error": error_message }).to_string()))
                        .unwrap());
                }

                // Second command: litestream restore
                let restore_command = format!(
                    "litestream restore -o /home/ubuntu/data/{}/pb_data/{}.db /home/ubuntu/data/{}/pb_data/{}.db", 
                    pitr_data.port, pitr_data.db, pitr_data.port, pitr_data.db
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

                // Return successful response for "erase-overwrite" mode
                let response_data = format!("Erase and overwrite operation completed for database: {}", pitr_data.db);
                return Ok(Response::builder()
                    .status(StatusCode::OK)
                    .body(Body::from(json!({ "data": response_data, "error": null }).to_string()))
                    .unwrap());
            }
        },
        _ => {
            // Handle unexpected mode
                // Return error response for unrecognized mode
                let error_message = format!("Unrecognized or unsupported mode: '{}'", pitr_data.mode);
                return Ok(Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .body(Body::from(json!({ "data": null, "error": error_message }).to_string()))
                    .unwrap());
        }
    }

    // Return successful response
    let response_data = format!("{}-{}.zip", destination, pitr_data.db);
    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(json!({ "data": response_data, "error": null }).to_string()))
        .unwrap())
}
