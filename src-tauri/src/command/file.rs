use serde::Serialize;
use std::{
    fs::{self, read_dir, File},
    io::{ Read, Write},
    path::Path
};
use tauri::InvokeError;

#[tauri::command]
pub fn get_file_content(name: String) -> Result<String, InvokeError> {
    let file = File::open(name);
    let mut file = match file {
        Ok(f) => f,
        Err(err) => return Err(InvokeError::from(err.to_string())),
    };
    let mut content = String::new();
    if let Err(err) = file.read_to_string(&mut content) {
        return Err(InvokeError::from(err.to_string()));
    }
    Ok(content)
}

#[tauri::command]
pub fn write_file(name: String, content: String) -> String {
    let res = File::create(name);
    if res.is_err() {
        return res.err().unwrap().to_string();
    }
    let mut buffer = res.unwrap();
    _ = buffer.write(content.as_bytes());
    String::from("ok")
}

#[derive(Serialize)]
pub struct FileItem {
    path: String,
    item_type: String,
}

#[tauri::command]
pub fn simple_read_dir(dir: String, ext: String) -> Vec<FileItem> {
    let mut list: Vec<FileItem> = Vec::new();
    let entry = read_dir(dir);
    if entry.is_err() {
        return list;
    }
    for item in entry.unwrap().into_iter() {
        if let Err(_) = item {
            continue;
        }
        let file_name = item.as_ref().unwrap().file_name().into_string().unwrap();
        let entry = item.unwrap().metadata().unwrap();
        if entry.is_dir() {
            if !file_name.starts_with(&".") {
                list.push(FileItem {
                    path: file_name,
                    item_type: String::from("dir"),
                })
            }
        } else {
            if file_name.ends_with(&ext) {
                list.push(FileItem {
                    path: file_name,
                    item_type: String::from("file"),
                })
            }
        }
    }

    list
}

#[tauri::command]
pub fn write_media_file(dir: String, name : String, content: Vec<u8>) -> String {
    let tmp_path = std::path::Path::new(&dir);
    if let Err(err) = std::fs::create_dir_all(&tmp_path) {
        return err.to_string();
    }
    let path_buf = tmp_path.join(&name);
    if let Ok(mut file) = File::create(path_buf.as_path()) {
        if let Ok(_) = file.write_all(&content) {
            return String::from("ok")
        }
    }
    String::from("error")
}

#[tauri::command]
pub fn create_dir(file_path: String) -> String {
    if let Err(err) = fs::create_dir_all(String::from(file_path)) {
        String::from(err.to_string())
    } else {
        String::from("ok")
    }
}

#[tauri::command]
pub fn create_file(file_path: String) -> String {
    if let Err(err) = File::create(String::from(file_path)) {
        String::from(err.to_string())
    } else {
        String::from("ok")
    }
}

#[tauri::command]
pub fn delete_file(file_path: String) -> String {
    if let Err(err) =  fs::remove_file(String::from(file_path)) {
        String::from(err.to_string())
    } else {
        String::from("ok")
    }
}

#[tauri::command]
pub fn delete_folder(file_path: String) -> String {
    if let Err(err) =  fs::remove_dir_all(String::from(file_path)) {
        String::from(err.to_string())
    } else {
        String::from("ok")
    }
}

#[tauri::command]
pub fn rename_file(file_path: String, new_file_path : String) -> String {
    if let Err(err) =  fs::rename(String::from(file_path), String::from(new_file_path)) {
        String::from(err.to_string())
    } else {
        String::from("ok")
    }
}

#[tauri::command]
pub fn file_exists(file_path: String) -> bool {
    Path::new(&file_path).exists()
}

