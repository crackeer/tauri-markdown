import React from 'react';

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
import copyCode from '../plugins/code-copy'
import externalLink from '../plugins/external-link'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import gemoji from '@bytemd/plugin-gemoji'
import frontmatter from '@bytemd/plugin-frontmatter'
import { Editor, Viewer } from '@bytemd/react'
import { uploadFile, readFile, writeFile } from '../util/invoke'
import dayjs from 'dayjs'
import { Modal, Message } from '@arco-design/web-react';
import { md5 } from '@/util/common';

const plugins = [
    gfm(), highlight(), mermaid(), math(), gemoji(), frontmatter(), mediumZoom(), externalLink()
]

const getUploadConfig = async (activeFile) => {
    const { sep, join } = await import('@tauri-apps/api/path')
    let parts = activeFile.split(sep)
    parts[parts.length - 1] = "images"
    let imageName = dayjs().format('YYYY-MM-DD-HH-mm-ss') + ".jpg"
    let dir = await join(...parts)
    return {
        uploadDir: dir,
        fileName: imageName,
        mdFile: "images/" + imageName
    }
}

const MDEdit = (props) => {

    async function doUploadImages(files) {
        let buffer = await files[0].arrayBuffer()
        let view = new Uint8Array(buffer);
        let list = []
        for (var i in view) {
            list.push(view[i])
        }
        let uploadConfig = await getUploadConfig(props.file)
        await uploadFile(uploadConfig.uploadDir, uploadConfig.fileName, list)
        return new Promise((resolve, _) => {
            resolve([{
                url: uploadConfig.mdFile,
                title: uploadConfig.fileName
            }])
        })
    }

    return <Editor
        value={value}
        plugins={[image(file, sep), ...plugins]}
        mode="auto"
        uploadImages={doUploadImages}
        onChange={props.onChange} />
}

export default MDEdit;