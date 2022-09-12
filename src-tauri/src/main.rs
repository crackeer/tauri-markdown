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

use command::file::{get_file_content,write_file,get_file_list};
use tauri::WindowMenuEvent;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

fn main() {
    let menu = Menu::new().add_item(CustomMenuItem::new("open", "打开")).add_item(CustomMenuItem::new("quit", "退出"));
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            my_custom_command,
            get_file_content,
            get_file_list,
            write_file,
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
            event.window().emit("open", "Open File");
        }
        _ => {}
    }
}
