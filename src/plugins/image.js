import { convertFileSrc } from '@tauri-apps/api/tauri';
var urls = require('rehype-urls')

export default function localImageSrc(currentFile, sep) {
    return {
        rehype:  (processor) => processor.use(urls, (url, ele) => {
           
            if(url.href.indexOf('http://') == 0) {
                return  null
            }
            if(url.href.indexOf('https://') == 0) {
                return null
            }
            let parts = currentFile.split(sep)
            parts[parts.length - 1] = url.pathname

            /*
            if(ele.tagName == "a") {
                if(ele.properties.href != undefined) {
                    return "javascript:window.open('" + url.href + "',  '_blank')"
                }
            }*/
            return convertFileSrc(parts.join(sep));
        })
    }
}