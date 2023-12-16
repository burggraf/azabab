use hyper::{Body, Request, Response, Server, StatusCode};
use hyper::service::{make_service_fn, service_fn};
use std::process::Command;
use hyper::client::Client;
use std::fs::OpenOptions;
use std::io::Write;
use serde_json::json;

const AUTH_TOKEN: &str = "your_predefined_auth_token";  // Replace with your actual token


#[tokio::main]
async fn main() {
    let addr = ([127, 0, 0, 1], 5000).into();

    let make_svc = make_service_fn(|_conn| async {
        Ok::<_, hyper::Error>(service_fn(request_handler))
    });

    let server = Server::bind(&addr).serve(make_svc);

    println!("Listening on http://{}", addr);

    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}

async fn request_handler(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    match (req.uri().path(), req.method()) {
        ("/createproject", &hyper::Method::POST) => {
            handle_create_project(req).await
        }
        _ => {
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
    }
}

async fn handle_create_project(mut req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    if let Some(auth_header) = req.headers().get(hyper::header::AUTHORIZATION) {
        if auth_header != AUTH_TOKEN {
            return Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .body(Body::from("Unauthorized"))
                .unwrap());
        }
    } else {
        return Ok(Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .body(Body::from("No Authorization Header"))
            .unwrap());
    }

    let body_bytes = hyper::body::to_bytes(req.body_mut()).await?;
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    let body_params: serde_json::Value = serde_json::from_str(&body_str).unwrap();

    let domain = body_params["domain"].as_str().unwrap_or_default();
    let port = body_params["port"].as_str().unwrap_or_default();

    let mut file = OpenOptions::new()
        .append(true)
        .open("/etc/nginx/domain_ports.txt")
        .unwrap();

    if writeln!(file, "{}    {};", domain, port).is_ok() {
        let _ = Command::new("sh")
            .arg("-c")
            .arg(format!("sudo kill -HUP $(cat /var/run/nginx.pid)"))
            .output();

        Ok(Response::builder()
            .status(StatusCode::OK)
            .body(Body::from(json!({ "data": "OK", "error": null }).to_string()))
            .unwrap())
    } else {
        Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::from(json!({ "data": null, "error": "Failed to write to file" }).to_string()))
            .unwrap())
    }
}
