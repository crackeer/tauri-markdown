import { writeText, readText } from '@tauri-apps/api/clipboard';
import {  Message } from '@arco-design/web-react';
import { emit } from '@tauri-apps/api/event';
export default function openFile(sep) {
    function openNewFile(node) {
        node.onclick = async () => {
            let file = node.href.substr(8)
            file = file.replaceAll('/', sep);
            await emit('select_file', { file :  file});
        }
    }
    return {
        viewerEffect({ markdownBody }) {
            (async (markdownBody) => {
                const els = markdownBody.querySelectorAll('a')
                els.forEach(el => {  
                    if(el.href.indexOf('file://') === 0) {
                        openNewFile(el)
                    }
                });
            })(markdownBody)
        }
    }
}