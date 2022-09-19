#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod command;

use std::{
    fs::metadata,
    fs::{read_dir, DirEntry, File},
    io::{Read, Write},
    sync::Arc,
    vec,
};

use command::file::{get_file_content, get_file_list, simple_read_dir, write_file, write_media_file};
use tauri::{WindowMenuEvent, Window};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

fn main() {
    let menu = Menu::new()
        .add_item(CustomMenuItem::new("open", "打开"))
        .add_item(CustomMenuItem::new("quit", "退出")).add_native_item(MenuItem::Copy);
    
    let menu =Menu::new()
    .add_submenu(Submenu::new(
      "View", // 子菜单名称
      Menu::new() // 子菜单项
        .add_native_item(MenuItem::Quit).add_item(CustomMenuItem::new("open", "打开"))
        .add_item(CustomMenuItem::new("quit", "退出")).add_native_item(MenuItem::Copy)
    ));
    //let menu = Menu::os_default(&"sss");
    let ctx = tauri::generate_context!();
    tauri::Builder::default()
       .invoke_handler(tauri::generate_handler![
            my_custom_command,
            get_file_content,
            get_file_list,
            write_file,
            simple_read_dir,
            set_window_title,
            write_media_file
        ])
        .menu(menu)
        .on_menu_event(window_menu_event)
        .run(ctx)
        .expect("error while running tauri application");
}

#[tauri::command]
fn my_custom_command() -> String {
    String::from("Simple test")
}

#[tauri::command]
fn set_window_title(window : Window, title: String) -> String {
   window.set_title(title.as_str());
   String::from("ok")
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
            event.window().emit("open", "Open File");
        }
        _ => {}
    }
}
