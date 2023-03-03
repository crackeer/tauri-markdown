#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod command;

use std::vec;

use command::file::{
    create_dir, create_file, get_file_content, get_file_list, simple_read_dir, write_file,
    write_media_file,
};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tauri::{Window, WindowMenuEvent};

fn main() {
    // 这里 `"quit".to_string()` 定义菜单项 ID，第二个参数是菜单项标签。
    let close = CustomMenuItem::new("open_folder".to_string(), "Open Folder");
    let submenu = Submenu::new("File", Menu::new().add_item(close));
    let menu = Menu::new()
        .add_submenu(submenu);
    //let menu = Menu::os_default(&"sss");
    let ctx = tauri::generate_context!();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_file_content,
            get_file_list,
            write_file,
            simple_read_dir,
            set_window_title,
            write_media_file,
            create_dir,
            create_file,
        ])
        .menu(menu)
        .on_menu_event(window_menu_event)
        .run(ctx)
        .expect("error while running tauri application");
}

#[tauri::command]
fn set_window_title(window: Window, title: String) -> String {
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
        "open_folder" => {
            event.window().emit("open_folder", "Open Folder");
        }
        _ => {}
    }
}
