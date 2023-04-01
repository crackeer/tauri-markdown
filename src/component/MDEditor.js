import 'bytemd/dist/index.css'
import { useEffect } from 'react'
import 'highlight.js/styles/default.css'
import 'katex/dist/katex.css'
import 'github-markdown-css/github-markdown-light.css'
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import gfm from '@bytemd/plugin-gfm'
import math from '@bytemd/plugin-math'
import image from '../plugins/image'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import gemoji from '@bytemd/plugin-gemoji'
import frontmatter from '@bytemd/plugin-frontmatter'
import { Editor } from '@bytemd/react'
import { uploadFile } from '../util/invoke'
import dayjs from 'dayjs'

const plugins = [
    gfm(), highlight(), mermaid(), mediumZoom(), math(), gemoji(), frontmatter()
]

var tauriApiPath = null

export default function (props) {
    useEffect(() => {
        async function setup() {
            tauriApiPath = await require('@tauri-apps/api/path')
        }
        setup()
    }, [])
    async function uploadImage(files) {
        
        let buffer = await files[0].arrayBuffer()
        let view = new Uint8Array(buffer);
        let list = []
        for (var i in view) {
            list.push(view[i])
        }
        let parts = props.activeFile.split(props.sep)
        parts[parts.length - 1] = "image"
        let imageName = dayjs().format('YYYY-MM-DD-HH-mm-ss') + ".jpg"
        let dir = await tauriApiPath.join(...parts)
        await uploadFile(dir, imageName, list)
        return new Promise((resolve, _) => {
            resolve([{
                url: "image/" + imageName,
                title: imageName
            }])
        })
    }
    return <Editor
        value={props.value}
        plugins={[image(props.activeFile, props.sep), ...plugins]}
        mode="auto"
        uploadImages={uploadImage}
        onChange={props.onChange} />
}