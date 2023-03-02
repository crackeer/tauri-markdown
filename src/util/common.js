import { join, sep as SEP } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { IconArrowLeft } from '@arco-design/web-react/icon';


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

var genQuickDirs = (rootDir, currentDir, maxSize) => {
    let relativePath = getRelativePath(currentDir, rootDir)
    let parts = relativePath.split(SEP)
    let list = [
        {
            name: "Home",
            path: rootDir,
        }
    ]
    if (relativePath.length < 1) {
        return list
    }
    let afterList = []
    for (var i = 0; i < parts.length; i++) {
        afterList.push({
            path: parts.slice(0, i + 1).join(SEP),
            name: parts[i]
        })
    }

    console.log(list.length, maxSize)
    let startAppendIndex = 1
    if (afterList.length > maxSize) {
        let firstIndex = afterList.length - maxSize
        list.push({
            name: "...",
            path: afterList[firstIndex].path
        })
        startAppendIndex = firstIndex + 1
    }

    for (var i = startAppendIndex; i < afterList.length; i++) {
        list.push(afterList[i])
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
