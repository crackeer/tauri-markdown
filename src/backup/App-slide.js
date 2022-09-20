import './App.css';
import React, { useEffect, useRef } from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { open } from '@tauri-apps/api/dialog';
import { getLatestLoadDir, setLatestLoadDir, ensureBaseDir, setActiveFileCache, deleteActiveFileCache } from './util/fs'
import { convertLocalImage } from './util/markdown'
import { fmtFileList, genQuickDirs, getRelativePath } from './util/common'
import { writeFile, readFile, uploadFile, simpleReadDir, setWindowTitle } from './util/invoke'
import { Space, Button, Link, Layout } from '@arco-design/web-react';
import { homeDir, join, resourceDir, sep as SEP } from '@tauri-apps/api/path';
import IconFolder from './asserts/svg/folder.js';
import IconMarkdown from './asserts/svg/markdown';
import Vditor from 'vditor'
import "vditor/dist/index.css";
import dayjs from 'dayjs';
import { listen } from '@tauri-apps/api/event'
import { fireEvent } from '@testing-library/react';

const Sider = Layout.Sider;
const Content = Layout.Content;

const QuickDir = (props) => {
    let list = props.list
    if (list.length < 1) {
        return null
    }
    return <div className="quick-directory">
        <a href="javascript:;" onClick={() => props.onClickItem(list[0])}>{list[0].name} </a>
        {
            list.length > 1 ? <QuickDir list={list.splice(1)} onClickItem={props.onClickItem} /> : null
        }

    </div>
}


class App extends React.Component {
    vditor = null
    vditorEle = null
    unlisten = null
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
        let parts = await getLatestLoadDir()
        console.log(parts)
        if (parts.length > 0) {
            let currentDir = parts[1] == undefined ? parts[0] : parts[1];
            await this.setState({
                activeFile: parts[2] == undefined ? '' : parts[1],
            })
            await this.loadDir(parts[0], currentDir)
        }
        window.addEventListener('resize', this.onResizeWindow)
    }
    componentWillUnmount() {
        if (this.unlisten != null && typeof this.unlisten == 'function') {
            this.unlisten()
        }
    }
    onResizeWindow = () => {
        console.log(this.vditor, this.vditorEle)
        this.setState({
            vditorHeight: window.innerHeight - 10
        })
    }
    openFile = async () => {
        const homeDirPath = await homeDir();
        let selected = await open({
            directory: true,
            multiple: false,
            defaultPath: homeDirPath,
        });
        console.log(selected)
        await this.loadDir(selected, selected)
        await setLatestLoadDir(selected, selected, '')
    }
    loadDir = async (rootDir, dir) => {
        let fileList = await simpleReadDir(dir, ".md")
        fileList = fmtFileList(fileList, this.state.currentDir)
        let tmp = getRelativePath(dir, rootDir)
        await this.setState({
            rootDir : rootDir,
            fileList: fileList,
            currentDir : dir,
            relativeDirs : genQuickDirs(tmp, rootDir)
        })
    }
    getContent = async (name) => {
        let data = await readFile(name)
        await this.setState({
            activeFile : name,
        })
        this.vditor.setValue(data)
        await setWindowTitle(name)
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
            await setWindowTitle(this.state.activeFile)
            await deleteActiveFileCache(this.state.activeFile)
        }
    }
    clickFile = async (item) => {
        let currentPath = await join(this.state.currentDir, item.path)
        if (item.item_type == 'dir') {
            await this.loadDir(this.state.rootDir, currentPath)
        } else {
            await this.getContent(currentPath)
        }
        setLatestLoadDir(this.state.rootDir, this.state.currentDir, this.state.activeFile)
    }
    quickSelect = async (relativePath) => {
        let currentDir = await join(this.state.rootDir, relativePath)
        if (relativePath == this.state.rootDir) {
            currentDir = this.state.rootDir
        }
        await this.loadDir(this.state.rootDir, currentDir)
    }
    loadEditor = (ele) => {
        this.vditorEle = ele
        if (ele == null) {
            return
        }
        this.vditor = new Vditor("container-editor", {
            height: window.innerHeight - 10,
            upload: {
                handler: this.uploadImage
            },
            input: this.onInput
        })
    }
    onInput = async (str) => {
        setWindowTitle(this.state.activeFile + '(有修改)')
        await setActiveFileCache(this.state.activeFile, str)
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
        await uploadFile(fullFilePath, list)
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
                            minWidth: '20%',
                            maxWidth: '25%',
                            height: '100vh',
                            overflow: 'scroll'
                        }}
                        size="small"
                    >
                        {
                            this.state.relativeDirs.length > 0 ? <>
                                <Space wrap size={[1, 1]} split={'/'}>

                                    {
                                        this.state.relativeDirs.map(item => {
                                            return <Link onClick={this.quickSelect.bind(this, item.path)}>{item.name}</Link>
                                        })
                                    }
                                </Space>
                                <hr />
                            </> : null
                        }

                        <div className="directory">
                            {this.state.fileList.map(item => {
                                if (item.item_type == 'dir') {
                                    return <div className="directory-item">
                                        <IconFolder height={25} width={25} />
                                        <span onClick={this.clickFile.bind(this, item)}>{item.path}</span>
                                    </div>
                                }
                                return <div className={item.abs_path == this.state.activeFile ? 'directory-item directory-item-md directory-item-active' : 'directory-item directory-item-md'} key={this.state.abs_path}>
                                    <span onClick={this.clickFile.bind(this, item)}>{item.path}</span>
                                </div>
                            })}
                        </div>
                        {
                            this.state.rootDir.length < 1 ? <div className="empty-directory">
                                <Button type="primary" onClick={this.openFile}>打开</Button>
                            </div> : null
                        }
                    </Sider>
                    <Content onKeyUp={this.handleKeyUp}>
                        <div style={{ margin: '5px auto', width: '95%' }}>
                            <div style={{ height: this.state.vditorHeight }} ref={this.loadEditor} id="container-editor">
                            </div>
                        </div>
                    </Content>
                </Layout>
            </div>
        )
    }
}

export default App
