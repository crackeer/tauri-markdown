use serde::Serialize;
use std::{
    fs::metadata,
    fs::{read_dir, DirEntry, File},
    io::{Read, Write},
    sync::Arc,
    vec,
};
use tauri::command as aaa;

#[tauri::command]
pub fn get_file_content(name: String) -> String {
    let mut file_a = File::open(name).unwrap();
    let mut content = String::new();
    file_a.read_to_string(&mut content);
    content
}

#[tauri::command]
pub fn write_file(name: String, content: String) -> String {
    let res = File::create(name);
    if res.is_err() {
        return res.err().unwrap().to_string();
    }
    let mut buffer = res.unwrap();
    buffer.write(content.as_bytes());
    String::from("ok")
}

#[tauri::command]
pub fn get_file_list(dir: String, ext: String) -> Vec<String> {
    let mut dir_vec: Vec<String> = Vec::new();
    let mut list: Vec<String> = Vec::new();
    println!("{}", dir);
    dir_vec.push(dir);

    let mut cur_index: usize = 0;
    while cur_index < dir_vec.len() {
        let entry = read_dir(dir_vec.get(cur_index).unwrap().to_string());
        if let Ok(data) = entry {
            for item in data.into_iter() {
                if let Ok(dataEntry) = item {
                    if let Ok(abc) = dataEntry.metadata() {
                        if abc.is_dir() {
                            dir_vec.push(dataEntry.path().to_str().unwrap().clone().to_string());
                        } else {
                            let file = dataEntry.path().to_str().unwrap().to_string();
                            if file.ends_with(&ext) {
                                list.push(file);
                            }
                        }
                    }
                }
            }
        }
        cur_index = cur_index + 1;
    }
    list
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
        if let Ok(dataEntry) = item {
            if let Ok(abc) = dataEntry.metadata() {
                if abc.is_dir() {
                    list.push(FileItem {
                        path: dataEntry.path().to_str().unwrap().clone().to_string(),
                        item_type: String::from("dir"),
                    });
                } else {
                    let file = dataEntry.path().to_str().unwrap().to_string();
                    if file.ends_with(&ext) {
                        list.push(FileItem {
                            path: file,
                            item_type: String::from("file"),
                        });
                    }
                }
            }
        }
    }

    list
}
