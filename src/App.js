import './App.css';
import React, { useEffect, useRef } from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { open } from '@tauri-apps/api/dialog';
import { getLatestLoadDir, setLatestLoadDir, ensureBaseDir } from './util/fs'
import { convertLocalImage } from './util/markdown'
import { writeFile, readFile, uploadFile, simpleReadDir, setWindowTitle } from './util/invoke'
import { Drawer, Button, Layout } from '@arco-design/web-react';
import { homeDir, join, resourceDir, sep as SEP } from '@tauri-apps/api/path';
import IconFolder from './asserts/svg/folder.js';
import IconMarkdown from './asserts/svg/markdown';
import Vditor from 'vditor'
import "vditor/dist/index.css";
import dayjs from 'dayjs';
const Sider = Layout.Sider;
const Content = Layout.Content;

class App extends React.Component {
    vditor = null
    vditorEle = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            value: '',
            treeData: [],

            rootDir: '',
            currentDir: '',
            fileList: [],

            visible: true,
            cursor: null,
            activeFile: '',
            changed: false,

            relativeDirs: [],
            vditorHeight: 0
        }

    }
    async componentDidMount() {
        await ensureBaseDir()
        let latestDir = await getLatestLoadDir()
        if (latestDir.length > 0) {

            await this.setState({
                rootDir: latestDir
            })
            await this.loadDir(latestDir)
        }
        window.addEventListener('resize', this.onResizeWindow)
    }
    onResizeWindow = () => {
        console.log(this.vditor, this.vditorEle)
        this.setState({
            vditorHeight: window.innerHeight
        })
    }
    openFile = async () => {
        const homeDirPath = await homeDir();
        let selected = await open({
            directory: true,
            multiple: false,
            defaultPath: homeDirPath,
        });
        await this.setState({
            rootDir: selected,
            currentDir: selected
        })
        await setLatestLoadDir(selected)
        await this.loadDir(selected)
    }
    loadDir = async (dir) => {
        let fileList = await simpleReadDir(dir, ".md")
        await this.setState({
            fileList: fileList,
            currentDir: dir,
        })
        await setWindowTitle(dir)
        await this.setState({
            relativeDirs: this.genQuickDirs(this.getRelativePath(dir, this.state.rootDir))
        })
    }
    getContent = async (name) => {
        let data = await readFile(name)
        await this.setState({
            value: data,
            activeFile: name,
            changed: false,
        })
        this.vditor.setValue(data)
        this.convertImage()
    }
    convertImage = () => {
        setTimeout(() => {
            convertLocalImage(this.state.activeFile)
        }, 1000)
    }
    handleKeyUp = async (event) => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            let result = await writeFile(this.state.activeFile, this.vditor.getValue())
            await this.setState({
                changed: false,
            })
            alert(result)
        }
    }
    clickFile = async (item) => {
        let currentPath = await join(this.state.currentDir, item.path)
        if (item.item_type == 'dir') {
            await this.loadDir(currentPath);
        } else {
            await this.getContent(currentPath)
            await this.setState({
                visible: false
            })
        }

    }
    getRelativePath = (currentDir, rootDir) => {
        if (currentDir == rootDir) {
            return ''
        }
        return currentDir.substr(rootDir.length + 1)
    }
    genQuickDirs = (relativePath) => {
        if (relativePath.length < 1) {
            return []
        }
        let parts = relativePath.split(SEP)
        let list = [{
            path: '..',
            name: '主页'
        }]
        for (var i = 0; i < parts.length; i++) {
            list.push({
                path: parts.slice(0, i + 1).join(SEP),
                name: parts[i]
            })
        }
        return list
    }
    quickSelect = async (relativePath) => {
        let currentDir = await join(this.state.rootDir, relativePath)
        if (relativePath == "..") {
            currentDir = this.state.rootDir
        }
        await this.loadDir(currentDir);
    }
    loadEditor = (ele) => {
        this.vditorEle = ele
        if (ele == null) {
            return
        }
        this.vditor = new Vditor("container-editor", {
            height: window.innerHeight,
            width: '95%',
            outline: {
                enable: false,
                position: 'right'
            },
            upload: {
                handler: this.uploadImage
            }
        })
    }
    uploadImage = async (files) => {
        console.log(files, files.length)
        let buffer = await files[0].arrayBuffer()
        let view = new Uint8Array(buffer);
        let list = []
        for (var i in view) {
            list.push(view[i])
        }
        let fileName = "image/" + dayjs().format('YYYY-MM-DD-HH-mm-ss') + ".jpg"

        let fullFilePath = [this.state.currentDir, fileName].join("/")
        console.log(fullFilePath)
        let result = await uploadFile(fullFilePath, list)
        console.log(result)
        await this.vditor.insertValue('![' + fileName + '](' + fileName + ')', true)
        this.convertImage()
    }

    render() {
        return (
            <div className="app">
                <Layout>
                    <Sider
                        resizeDirections={['right']}
                        style={{
                            minWidth: 200,
                            maxWidth: 300,
                            height: '100vh',
                            overflow: 'scroll'
                        }}
                        size="small"
                    >
                        {this.state.fileList.length < 1 && this.state.currentDir.length < 1 ? <div style={{ paddingTop: '30%', textAlign: 'center' }}>
                            <Button type="primary" onClick={this.openFile}>打开文件夹</Button>
                        </div> : ''}
                        {
                            this.state.relativeDirs.map((item, i) => {
                                return <a href="javascript:;" onClick={this.quickSelect.bind(this, item.path)}>{item.name} {i < this.state.relativeDirs.length - 1 ? '/' : ''}</a>
                            })
                        }

                        {this.state.fileList.map(item => {
                            return <p style={{
                                verticalAlign: 'middle'
                            }}>{item.item_type == 'dir' ? <IconFolder height={25} width={25} /> : <IconMarkdown height={25} width={25} />}
                                <a style={{ marginLeft: '10px' }} href="javascript:;" onClick={this.clickFile.bind(this, item)}>{item.path}</a></p>
                        })}
                    </Sider>
                    <Content onKeyUp={this.handleKeyUp}>
                        <div style={{ margin: '0 auto', height: this.state.vditorHeight }} ref={this.loadEditor} id="container-editor">
                        </div>
                    </Content>
                </Layout>
            </div>
        )
    }
}

export default App
