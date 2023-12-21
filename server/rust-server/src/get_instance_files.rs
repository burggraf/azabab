use hyper::{Body, Request, Response};
use walkdir::WalkDir;
//use std::path::Path;

pub async fn handle_get_instance_files(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    // Extract the 'port' parameter from the query
    let query = req.uri().query().unwrap_or("");
    let params: Vec<&str> = query.split('&').collect();
    let port_param = params.iter().find(|&&param| param.starts_with("port="));

    if let Some(port_param) = port_param {
        let port = &port_param[5..]; // Assumes the format is "port=xxxx"
        let dir_path = format!("/home/ubuntu/data/{}", port);

        // Use WalkDir to traverse the directory
        let walker = WalkDir::new(&dir_path).into_iter();
        let mut file_paths = vec![];

        for entry in walker.filter_map(|e| e.ok()) {
            let path = entry.path();
            if let Ok(strip_path) = path.strip_prefix(&dir_path) {
                file_paths.push(format!("./{}", strip_path.display()));
            }
        }

        // Convert the file list to a string and create a response
        let body = Body::from(file_paths.join("\n"));
        Ok(Response::new(body))
    } else {
        let body = Body::from("Port parameter is missing");
        Ok(Response::new(body))
    }
}
