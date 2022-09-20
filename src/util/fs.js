import { writeTextFile, BaseDirectory, readTextFile, readDir, createDir, removeFile } from '@tauri-apps/api/fs';
import { sep as SEP } from '@tauri-apps/api/path';
const dirLatestCache = 'dir.latest.cache'

var getLatestLoadDir = async () => {
    try {
        let contents = await readTextFile(dirLatestCache, { dir: BaseDirectory.App });
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
        return await writeTextFile(dirLatestCache, content, { dir: BaseDirectory.App });
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

export {
    getLatestLoadDir, setLatestLoadDir, ensureBaseDir, setActiveFileCache, deleteActiveFileCache
}