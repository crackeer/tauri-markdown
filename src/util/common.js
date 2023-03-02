import { join, sep as SEP } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';


var fmtFileList = (fileList, currentDir) => {
    fileList = fileList.sort((a, b) => {
        if (a.item_type == b.item_type) {
            if (a.path < b.path) {
                return -1
            }
            return 1
        }
        if (a.item_type == 'dir') {
            return -1
        }
        return 1
    })
    for (var i in fileList) {
        fileList[i].abs_path = currentDir + SEP + fileList[i].path
    }
    return fileList
}

var genQuickDirs = (rootDir, currentDir) => {
    let relativePath = getRelativePath(currentDir, rootDir)
    let parts = relativePath.split(SEP)
    let rootName = rootDir.replaceAll('\\', '/')
    let list = [
        {
            name: rootName,
            path: rootDir,
        }
    ]
    if (relativePath.length < 1) {
        return list
    }
    for (var i = 0; i < parts.length; i++) {
        list.push({
            path: parts.slice(0, i + 1).join(SEP),
            name: parts[i]
        })
    }
    return list
}

var getRelativePath = (currentDir, rootDir) => {
    if (currentDir == rootDir) {
        return ''
    }
    return currentDir.substr(rootDir.length + 1)
}

export {
    fmtFileList, genQuickDirs, getRelativePath
}
