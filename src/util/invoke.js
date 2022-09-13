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

export {
    writeFile, readFile, readDir, simpleReadDir, setWindowTitle
}
