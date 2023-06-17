import { writeTextFile, BaseDirectory, readTextFile, readDir, createDir, removeFile } from '@tauri-apps/api/fs';
import dayjs from 'dayjs';
import { add } from 'lodash';

const MenuCollapsed = "MenuCollapsed";
const OpenFiles = "OpenFiles";

var get = async (key) => {
    try {
        let value =  await readTextFile(key, { dir: BaseDirectory.Cache });
        return value
    } catch(e) {
        return ''
    }
}

var set = async (key, value) => {
    try {
        return await writeTextFile(key, value, { dir: BaseDirectory.Cache });
    } catch(e) {
        return false;
    }
}

var getMenuCollapsed = async () => {
    let value = await get(MenuCollapsed)
    return parseInt(value)
}

var setMenuCollapsed = async (value) => {
    return set(MenuCollapsed, value +'')
}


var getOpenFiles = async () => {
    let value = await get(OpenFiles)
    if(value.length < 1) {
        return []
    }
    return JSON.parse(value)
}

var addOpenFiles = async (addFiles) => {
    let files = await getOpenFiles()
    
    files = files.filter(item => {
        return addFiles.indexOf(item.file) < 0
    })
    let date = dayjs().format('YYYY-MM-DD')
    let time = dayjs().format('HH:mm:ss')
    for (var i in addFiles) {
        files.unshift({
            'file' : addFiles[i],
            'date' : date,
            'time' : time,
        })
    }
    await set(OpenFiles, JSON.stringify(files))
    return files
}

var deleteOpenFiles = async (addFiles) => {
    let files = await getOpenFiles()
    files = files.filter(item => {
        return addFiles.indexOf(item.file) < 0
    })
    await set(OpenFiles, JSON.stringify(files))
    return files
}
export default {
    getMenuCollapsed,
    setMenuCollapsed, 
    getOpenFiles,
    addOpenFiles,
    deleteOpenFiles,
}