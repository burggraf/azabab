mod create_project;
mod create_user;
mod catch_all_handler;
mod get_instance_files;
mod get_instance_file;

use hyper::{Body, Request, Response, Server};
use hyper::service::{make_service_fn, service_fn};
//use std::process::Command;
//use hyper::client::Client;
//use std::fs::OpenOptions;
//use std::io::Write;
//use serde_json::json;

const AUTH_TOKEN: &str = "your_predefined_auth_token";  // Replace with your actual token


#[tokio::main]
async fn main() {
    let addr = ([0, 0, 0, 0], 5000).into();

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
    match (req.uri().path(), req.method()) {
        ("/createproject", &hyper::Method::POST) => {
            create_project::handle_create_project(req, AUTH_TOKEN).await
        },
        ("/createuser", &hyper::Method::POST) => {
            create_user::handle_create_user(req, AUTH_TOKEN).await
        },
        ("/getinstancefiles", &hyper::Method::GET) => {
            get_instance_files::handle_get_instance_files(req).await
        },        
        ("/getinstancefile", &hyper::Method::POST) => {
            get_instance_file::handle_get_instance_file(req, AUTH_TOKEN).await
        },        
        _ => catch_all_handler::handle_catch_all(req).await
    }
}

