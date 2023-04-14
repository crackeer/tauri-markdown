import { writeText, readText } from '@tauri-apps/api/clipboard';
import {  Message } from '@arco-design/web-react';

export default function copyCode(options) {
    function createElement(tag, innerHTML, className, id) {
        const element = document.createElement(tag)
        element.className = className
        element.innerHTML = innerHTML
        return element
    }
    function copyCode(node) {
        node.onclick = async () => {
            let str = '';
            // @ts-ignore
            node.parentNode.children[0].childNodes.forEach(element => {
                str = str + element.textContent
            })
            if (options?.copyright) {
                str = str + options.copyright
            }
            await writeText(str)
            Message.success("复制成功")
        }
    }
    return {
        // @ts-ignore
        viewerEffect({ markdownBody }) {
            (async (markdownBody) => {
                const els = markdownBody.querySelectorAll('pre')
                els.forEach(el => {                    
                    const operateBtn = createElement('button', 'copy', 'copy-btn')
                    copyCode(operateBtn)
                    el.appendChild(operateBtn)

                });
            })(markdownBody)
        }
    }
}