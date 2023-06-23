import React from 'react';
import 'bytemd/dist/index.css'
import 'highlight.js/styles/default.css'
import 'katex/dist/katex.css'
import 'github-markdown-css/github-markdown-light.css'
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import gfm from '@bytemd/plugin-gfm'
import math from '@bytemd/plugin-math'
import image from '../plugins/image'
import copyCode from '../plugins/code-copy'
import openFile from '../plugins/open_file'
import externalLink from '../plugins/external-link'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import gemoji from '@bytemd/plugin-gemoji'
import frontmatter from '@bytemd/plugin-frontmatter'
import { Viewer } from '@bytemd/react'
const plugins = [
    gfm(), highlight(), mermaid(), math(), gemoji(), frontmatter(), mediumZoom(), externalLink(), copyCode()
]
const MDView = (props) => {
    return <Viewer value={props.value} plugins={[image(props.file, props.sep), openFile(props.sep),...plugins]} />
}

export default MDView;