mod create_project;
mod create_instance;
mod remove_project;
mod create_user;
mod remove_user;
mod catch_all_handler;
mod get_instance_files;
mod get_instance_file;
mod update_litestream;
mod get_litestream_generations;
mod pitr;

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
    // println!("req.uri().path(): {}",req.uri().path());
    match (req.uri().path(), req.method()) {
        ("/createproject", &hyper::Method::POST) => {
            create_project::handle_create_project(req, AUTH_TOKEN).await
        },
        ("/createinstance", &hyper::Method::POST) => {
            create_instance::handle_create_instance(req, AUTH_TOKEN).await
        },
        ("/removeproject", &hyper::Method::POST) => {
            remove_project::handle_remove_project(req, AUTH_TOKEN).await
        },
        ("/createuser", &hyper::Method::POST) => {
            create_user::handle_create_user(req, AUTH_TOKEN).await
        },
        ("/removeuser", &hyper::Method::POST) => {
            remove_user::handle_remove_user(req, AUTH_TOKEN).await
        },
        ("/getinstancefiles", &hyper::Method::GET) => {
            get_instance_files::handle_get_instance_files(req).await
        },        
        ("/getinstancefile", &hyper::Method::POST) => {
            get_instance_file::handle_get_instance_file(req, AUTH_TOKEN).await
        },
        ("/updatelitestream", &hyper::Method::POST) => {
            update_litestream::handle_update_litestream(req).await
        },
        ("/getlitestreamgenerations", &hyper::Method::POST) => {
            get_litestream_generations::handle_get_litestream_generations(req, AUTH_TOKEN).await
        },
        ("/pitr", &hyper::Method::POST) => {
            pitr::handle_pitr(req).await
        },
        _ => catch_all_handler::handle_catch_all(req).await
    }
}

