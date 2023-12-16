use hyper::{Request, Response, Body, StatusCode, client::Client};
use std::process::Command;

pub async fn handle_catch_all(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
            // Clone header values before mutating `req`
            let original_port = req.headers().get("X-Original-Port").unwrap().to_str().unwrap().to_owned();
            let original_uri = req.headers().get("X-Original-URI").unwrap().to_str().unwrap().to_owned();

            // Run command
            let output = Command::new("sudo")
                .arg("/home/ubuntu/run.sh")
                .arg(&original_port)
                .output()
                .expect("failed to execute process");

            let output_str = String::from_utf8_lossy(&output.stdout);

            if output_str.trim() != "OK" {
                return Ok(Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body(Body::from("Error in executing command"))
                    .unwrap());
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
