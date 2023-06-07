import { writeTextFile, BaseDirectory, readTextFile, readDir, createDir, removeFile } from '@tauri-apps/api/fs';

const MenuCollapsed = "MenuCollapsed";

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



export default {
    getMenuCollapsed, setMenuCollapsed
}