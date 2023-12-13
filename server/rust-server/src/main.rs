use hyper::{Body, Request, Response, Server, StatusCode};
use hyper::service::{make_service_fn, service_fn};
use std::process::Command;
use hyper::client::Client;
use tokio::process::Command as TokioCommand;

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

async fn request_handler(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    let original_port = req.headers().get("X-Original-Port").unwrap().to_str().unwrap();
    let original_uri = req.headers().get("X-Original-URI").unwrap().to_str().unwrap();

    // Run command
    let output = Command::new("sudo")
        .arg("/home/ubuntu/run.sh")
        .arg(original_port)
        .output()
        .expect("failed to execute process");

    let output_str = String::from_utf8_lossy(&output.stdout);

    if output_str.trim() != "OK" {
        return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::from("Error in executing command"))
            .unwrap());
    } 
    
    // Create a client and make a request to the original_uri
    let client = Client::new();
    let forward_uri = format!("http://localhost:{}{}", original_port, original_uri);
    let forward_req = Request::builder()
        .method(req.method())
        .uri(forward_uri)
        .body(Body::empty()) // You might want to forward the original body and headers
        .unwrap();

    let resp = client.request(forward_req).await?;

    if output_str.trim() == "OK" {
        let _stats_handle = TokioCommand::new("sudo")
            .arg("/home/ubuntu/stats.sh")
            .arg(original_port)
            .arg("start")
            .spawn();    
        // Note: We're not using .await here, so the command runs in the background
        // If you want to handle the result later, you can store _stats_handle and use .await on it
    }    
    // Forward the response back
    Ok(resp)
}
