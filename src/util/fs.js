import { writeTextFile, BaseDirectory, readTextFile, readDir, createDir } from '@tauri-apps/api/fs';
const dirLatestCache = 'dir.latest.cache'

var getLatestLoadDir = async () => {
    try {
        let contents = await readTextFile(dirLatestCache, { dir: BaseDirectory.App });
        return contents
    } catch(e) {
        return ""
    }
}

var setLatestLoadDir = async (content) => {
    try {
        return await writeTextFile(dirLatestCache, content, { dir: BaseDirectory.App });
    } catch(e) {
        console.log(e)
        return false
    }
}

var ensureBaseDir = async () => {
    try {
        await readDir('', { dir: BaseDirectory.App, recursive: false });
    } catch(e) {
        await createDir('', { dir: BaseDirectory.App, recursive: false }); 
        console.log(e)
    }
}

export {
    getLatestLoadDir, setLatestLoadDir, ensureBaseDir
}