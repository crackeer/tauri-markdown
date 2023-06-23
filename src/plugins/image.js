import { emit } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/tauri';
var urls = require('rehype-urls')
const path = require('path');


export default function localImageSrc(currentFile, sep) {
    return {
        rehype:  (processor) => processor.use(urls, (url, ele) => {
    
            if (url.href == null) return null;
            if(url.href.indexOf('http://') == 0) {
                return  null
            }
            if(url.href.indexOf('https://') == 0) {
                return null
            }
            
            let parts = currentFile.split(sep)
            parts.pop()
            let absolutePath = path.resolve(parts.join(sep), url.pathname)
            if(absolutePath == url.pathname) {
                parts.push(url.pathname)
                absolutePath = parts.join(sep)
            }
            console.log(absolutePath)
            /*
            let parts = currentFile.split(sep)
            parts[parts.length - 1] = url.pathname
            let absolutePath = parts.join(sep)*/
            
            if(ele.tagName == "a") {
                return "file://" + absolutePath
                if(ele.properties.href != undefined) {
                    return "/?" + absolutePath
                }
            }
            return convertFileSrc(absolutePath)
        })
    }
}