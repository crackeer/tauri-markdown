import { convertFileSrc } from '@tauri-apps/api/tauri';
var urls = require('rehype-urls')

export default function localImageSrc(currentFile, sep) {
    return {
        rehype:  (processor) => processor.use(urls, (url, ele) => {
            if(ele.tagName == "a") {
                if(ele.properties.href != undefined) {
                    return "javascript:window.open('" + url.href + "',  '_blank')"
                }
            }
            if(ele.tagName != "img") {
                return 
            }
            if(url.href.indexOf('http://') == 0) {
                return url.href
            }
            if(url.href.indexOf('https://') == 0) {
                return url.href
            }
          
            let parts = currentFile.split(sep)
            parts[parts.length - 1] = url.pathname
            return convertFileSrc(parts.join(sep));
        })
    }
}