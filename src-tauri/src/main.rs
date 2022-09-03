#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    fs::metadata,
    fs::{read_dir, DirEntry, File},
    io::Read,
    sync::Arc,
    vec,
};
use tauri::WindowMenuEvent;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

fn main() {
    let menu = Menu::new().add_item(CustomMenuItem::new("open", "打开")).add_item(CustomMenuItem::new("quit", "退出"));
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            my_custom_command,
            get_md_list,
            get_md_content,
        ])
        .menu(menu)
        .on_menu_event(window_menu_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn my_custom_command() -> String {
    String::from("Simple test")
}

fn window_menu_event(event: WindowMenuEvent) {
    match event.menu_item_id() {
        "quit" => {
            std::process::exit(0);
        }
        "close" => {
            event.window().close().unwrap();
        }
        "open" => {
            println!("{}", "open a file");
            event.window().emit("open", ("Open File"));
        }
        _ => {}
    }
}

#[tauri::command]
fn get_md_list(dir: String) -> Vec<String> {
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
                            if file.ends_with(".md") {
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

#[tauri::command]
fn get_md_content(name: String) -> String {
    let mut file_a = File::open(name).unwrap();
    let mut content = String::new();
    file_a.read_to_string(&mut content);
    content
}
