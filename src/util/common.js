var sortFileList = (fileList) => {
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
    return fileList
}

var genQuickDirs = (rootDir, currentDir, maxSize, sep) => {
    let relativePath = getRelativePath(currentDir, rootDir)

    let parts = relativePath.split(sep)

    let list = []
    if (relativePath.length < 1) {
        return list
    }
    let afterList = []
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
            afterList.push({
                path: parts.slice(0, i + 1).join(sep),
                name: parts[i]
            })
        }
    }
    let startAppendIndex = 0
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
    return currentDir.substr(rootDir.length)
}

export {
    sortFileList, genQuickDirs, getRelativePath
}
