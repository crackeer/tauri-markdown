import { writeTextFile, BaseDirectory, readTextFile, createDir, removeFile } from '@tauri-apps/api/fs';

import common from '@/util/common';
const loadConfigFile = "load.json"

var setLoadConfig = async (object) => {
    try {
        let content = JSON.stringify(object)
        return await writeTextFile(loadConfigFile, content, { dir: BaseDirectory.Cache });
    } catch(e) {
        return false
    }
}

var getLoadConfig = async () => {
    try {
        let data = await readTextFile(loadConfigFile, { dir: BaseDirectory.Cache });
        let result = JSON.parse(data)
        return result
    } catch(e) {
        await createDir('', { dir: BaseDirectory.Cache })
        return {}
    }
}

var getOpenFolder = async (rootDir) => {
    try {
        let data = await readTextFile(common.md5(rootDir), { dir: BaseDirectory.Cache });
        let result = JSON.parse(data)
        return result
    } catch(e) {
        return []
    }
}

var setOpenFolder = async (rootDir, folders) => {
    let content = JSON.stringify(folders)
    return await writeTextFile(common.md5(rootDir), content, { dir: BaseDirectory.Cache });
}

export default {
   getLoadConfig, setLoadConfig, getOpenFolder, setOpenFolder
}