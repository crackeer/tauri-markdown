const crypto = require('crypto');  

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


var getRelativePath = (currentDir, rootDir) => {
    if (currentDir == rootDir) {
        return ''
    }
    return currentDir.substr(rootDir.length)
}

var md5 = (str) => {

    // 创建MD5对象  
    let md5 = crypto.createHash('md5');  
      
    // 将字符串转换为字节数组  
    let bytes = str.split('').map(char => char.charCodeAt(0).toString(16)).join('');  
            
    return md5.update(bytes).digest('hex');  
  
}

var calculateCRC32 = (data) => {  
  const crc32 = new Uint32Array(data);  
  const crc32Value = crc32.reduce((acc, curr) => acc ^ curr, 0);  
  return crc32Value;  
}  

export {
    sortFileList, getRelativePath, md5, calculateCRC32
}

export default {
    sortFileList, getRelativePath, md5, calculateCRC32
}
