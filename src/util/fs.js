import { writeTextFile, BaseDirectory, readTextFile, readDir, createDir, removeFile } from '@tauri-apps/api/fs';


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


export default {
   getLoadConfig, setLoadConfig
}