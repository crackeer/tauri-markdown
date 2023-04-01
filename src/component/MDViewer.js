import 'bytemd/dist/index.css'
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
import { Viewer } from '@bytemd/react'

const plugins = [
    gfm(), highlight(), mermaid(), mediumZoom(), math(), gemoji(), frontmatter()
]
export default function (props) {
    return <Viewer value={props.value} plugins={[image(props.activeFile, props.sep), ...plugins]} />
}