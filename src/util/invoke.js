import { Result } from '@arco-design/web-react'
import { invoke } from '@tauri-apps/api/tauri'


var writeFile = async (file, content) => {
    let Result = await invoke('write_file', {
        name: file, content: content,
    })
    return Result
}

var readFile = async (file, content) => {
    let Result = await invoke('get_file_content', {
        name: file, content: content,
    })
    return Result
}


var readDir = async (dir, ext) => {
    let list = await invoke('get_file_list', {
        dir, ext
    })
    return list
}

var simpleReadDir = async (dir, ext) => {
    let list = await invoke('simple_read_dir', {
        dir, ext
    })
    return list
}

var setWindowTitle = async (title) => {
    let result = await invoke('set_window_title', {
        title
    })
    return result
}

var uploadFile = async (file_name, content) => {
    let result = await invoke('write_media_file', {
        fileName : file_name,
        content : content,
    })
    return result
}

var createFile = async (file_path) => {
    let result = await invoke('create_file', {
        filePath : file_path, 
    })
    return result
}

var createDir = async (file_path) => {
    let result = await invoke('create_dir', {
        filePath : file_path,
    })
    return result
}

export {
    writeFile, readFile, readDir, simpleReadDir, setWindowTitle, uploadFile, createFile, createDir
}
