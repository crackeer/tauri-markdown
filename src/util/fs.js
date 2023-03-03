import { writeTextFile, BaseDirectory, readTextFile, readDir, createDir, removeFile } from '@tauri-apps/api/fs';
import { sep as SEP } from '@tauri-apps/api/path';

const dirLatestCache = 'dir.latest.cache'
const loadConfigFile = "load.json"


var setLoadConfig = async (object) => {
    try {
        let content = JSON.stringify(object)
        return await writeTextFile(loadConfigFile, content, { dir: BaseDirectory.Config });
    } catch(e) {
        return false
    }
}

var getLoadConfig = async () => {
    try {
        let data = await readTextFile(loadConfigFile, { dir: BaseDirectory.Config });
        let result = JSON.parse(data)
        return result
    } catch(e) {
        return {}
    }
}

var getLatestLoadDir = async () => {
    try {
        let contents = await readTextFile(dirLatestCache, { dir: BaseDirectory.Config });
        let parts = contents.split('#')
        if(parts.length > 0 && parts[0] != '') {
            return parts
        }
        return []
    } catch(e) {
        return []
    }
}

var setLatestLoadDir = async (rootDir, currentDir, activeFile) => {
    try {
        let content = [rootDir, currentDir,activeFile].join('#')
        return await writeTextFile(dirLatestCache, content, { dir: BaseDirectory.Config });
    } catch(e) {
        console.log(e)
        return false
    }
}


var setActiveFileCache = async (activeFile, content) => {
    try {
        let fileName = activeFile.replaceAll(SEP, "@") + '.cache'
        return await writeTextFile(fileName, content, { dir: BaseDirectory.Cache });
    } catch(e) {
        return false
    }
}

var getActiveFileCache = async (activeFile) => {
    try {
        let fileName = activeFile.replaceAll(SEP, "@") + '.cache'
        return await readTextFile(fileName, { dir: BaseDirectory.Cache });
    } catch(e) {
        return false
    }
}

var deleteActiveFileCache = async (activeFile) => {
    try {
        let fileName = activeFile.replaceAll(SEP, "@") + '.cache'
        return await removeFile(fileName, { dir: BaseDirectory.Cache });
    } catch(e) {
        return false
    }
}


var ensureBaseDir = async () => {
    try {
        await readDir('', { dir: BaseDirectory.App, recursive: false });
    } catch(e) {
        await createDir('', { dir: BaseDirectory.App, recursive: false }); 
    }
}

var mkConfigDir = async () => {
    try {
        await readDir('', { dir: BaseDirectory.Config, recursive: false });
    } catch(e) {
        await createDir('', { dir: BaseDirectory.Config, recursive: false }); 
    }
}


export {
    getLatestLoadDir, setLatestLoadDir, ensureBaseDir, mkConfigDir, setActiveFileCache, deleteActiveFileCache, getLoadConfig, setLoadConfig
}