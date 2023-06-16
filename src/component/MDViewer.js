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
import image from '@/plugins/image'
import rehypeExternalLinks from '@/plugins/external-link'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import gemoji from '@bytemd/plugin-gemoji'
import frontmatter from '@bytemd/plugin-frontmatter'
import {  Viewer } from '@bytemd/react'

const plugins = [
    gfm(), highlight(), mermaid(), math(), gemoji(), frontmatter(), mediumZoom(), rehypeExternalLinks()
]

const MDViewer = (props) => {
    const [file, setFile] = React.useState("");
    const [sep, setSep] = React.useState("/");


    const initValue = async (file) => {
        const { sep } = await import('@tauri-apps/api/path')
        setSep(sep)
        setFile(file)
    }

    useEffect(() => {
        initValue(props.file)
    }, [])

    return <Viewer value={props.value} plugins={[image(file, sep), ...plugins]} />   
}

export default MDViewer;