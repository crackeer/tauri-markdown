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

const Markdown = React.forwardRef((props, ref) => {
    const [value, setValue] = React.useState("");
    const [mode, setMode] = React.useState("");
    const [oldValue, setOldValue] = React.useState(false);
    const [activeFile, setActiveFile] = React.useState("");
    const [sep, setSep] = React.useState("/");

    const changed = () => {
        console.log("changed", oldValue.length, value.length)
        return oldValue != value
    }
    const switchNewFile = async (newFile) => {
        if (changed()) {
            ask2Switch(newFile)
        } else {
            initValue(newFile)
        }
    }
    const ask2Switch = async (newFile) => {
        Modal.confirm({
            simple: true,
            title: "保存提示",
            content: "即将切换到其他文档，当前编辑的文档还未保存？请选择",
            okText: "是，立马保存",
            cancelText: "否，我要放弃",
            onOk: async () => {
                if (activeFile.length > 0) {
                    await writeFile(activeFile, value)
                }
                if (newFile != null && newFile.length > 0) {
                    initValue(newFile)
                }

            },
            onCancel: async () => {
                if (newFile != null && newFile.length > 0) {
                    initValue(newFile)
                }
            }
        })
    }

    const saveFile = async () => {
        if (changed()) {
            await writeFile(activeFile, value)
            Message.success("保存成功")
        }
    }

    const ask2Exit = async () => {
        const { appWindow } = await require('@tauri-apps/api/window')
        if (changed()) {
            Modal.confirm({
                simple: true,
                title: "保存提示",
                content: "即将关闭应用，当前编辑的文档还未保存？请选择",
                okText: "是，立马保存",
                cancelText: "否，我要放弃",
                onOk: async () => {
                    if (activeFile.length > 0) {
                        await writeFile(activeFile, value)
                    }
                    appWindow.close();
                },
                onCancel: async () => {
                    appWindow.close();
                }
            })
        } else {
            appWindow.close();
        }
    }

    const switchMode = async (newMode) => {
        if (mode === "view" || mode.length < 1) {
            setMode("edit");
            return
        }
        setMode('view')

    }

    async function doUploadImages(files) {
        let buffer = await files[0].arrayBuffer()
        let view = new Uint8Array(buffer);
        let list = []
        for (var i in view) {
            list.push(view[i])
        }
        let uploadConfig = await getUploadConfig(activeFile)
        await uploadFile(uploadConfig.uploadDir, uploadConfig.fileName, list)
        return new Promise((resolve, _) => {
            resolve([{
                url: uploadConfig.mdFile,
                title: uploadConfig.fileName
            }])
        })
    }
    const initValue = async (file, mode) => {
        const { sep } = await import('@tauri-apps/api/path')
        let data = await readFile(file)
        setSep(sep)
        setValue(data)
        setOldValue(data)
        setActiveFile(file)
        console.log("initValue", data.length)
        if (mode != null && mode.length > 0) {
            setMode(mode)
        }
    }

    useEffect(() => {
        initValue(props.file, props.mode)
    }, [])
    React.useImperativeHandle(
        ref,
        () => ({ initValue, switchNewFile, changed, ask2Exit, saveFile, switchMode })
    );

    if (mode === 'view') {
        return <div style={{ padding: '10px 7.5% 50px' }}>
            <Viewer value={value} plugins={[image(activeFile, sep), ...plugins]} />
        </div>;
    }

    return <Editor
        value={value}
        plugins={[image(activeFile, sep), ...plugins]}
        mode="auto"
        uploadImages={doUploadImages}
        onChange={(val) => {
            setValue(val)
            console.log("Change", val.length, val)
        }} />
})

export default Markdown;