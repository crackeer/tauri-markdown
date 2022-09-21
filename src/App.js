import './App.css';
import React, { useEffect, useRef } from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { open } from '@tauri-apps/api/dialog';
import { getLatestLoadDir, setLatestLoadDir, ensureConfigDir, setActiveFileCache, deleteActiveFileCache, getLoadConfig, setLoadConfig } from './util/fs'
import { convertLocalImage } from './util/markdown'
import { fmtFileList, genQuickDirs, getRelativePath } from './util/common'
import { writeFile, readFile, uploadFile, simpleReadDir, setWindowTitle } from './util/invoke'
import { Space, Button, Link, Layout, Drawer } from '@arco-design/web-react';
import { homeDir, join, resourceDir, sep as SEP } from '@tauri-apps/api/path';
import IconFolder from './asserts/svg/folder.js';
import IconMarkdown from './asserts/svg/markdown';
import Vditor from 'vditor'
import "vditor/dist/index.css";
import dayjs from 'dayjs';
import { listen } from '@tauri-apps/api/event'

const Sider = Layout.Sider;
const Content = Layout.Content;

const QuickDir = (props) => {
    if (props.relativeDirs == undefined || props.relativeDirs.length < 1) {
        return null
    }
    return <div>
        <Space wrap size={[1, 1]} split={'/'}>
            {
                props.relativeDirs.map(item => {
                    return <Link onClick={() => props.quickSelect(item.path)}>{item.name}</Link>
                })
            }
        </Space>
    </div>
}
const FileList = (props) => {
    if (props.rootDir == undefined || props.rootDir.length < 1) {
        return <div>
            <Button type="primary" onClick={props.openFile}>打开</Button>
        </div>
    }
    return <div className="directory">
        {props.fileList.map(item => {
            if (item.item_type == 'dir') {
                return <div className="directory-item">
                    <IconFolder height={25} width={25} />
                    <span onClick={() => props.clickFile(item)}>{item.path}</span>
                </div>
            }
            return <div className={item.abs_path == this.state.activeFile ? 'directory-item directory-item-md directory-item-active' : 'directory-item directory-item-md'} key={this.state.abs_path}>
                <span onClick={() => props.clickFile(item)}>{item.path}</span>
            </div>
        })}
    </div>
}

const getVditorHeight = () => {
    return window.innerHeight - 10
}


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

            visible: false,
            cursor: null,
            activeFile: '',
            changed: false,

            relativeDirs: [],
            vditorHeight: 0
        }
    }
    async componentDidMount() {
        await ensureConfigDir()
        let object = await getLoadConfig()
        if (object != undefined) {
            await this.getContent(object.activeFile)
        }
        window.addEventListener('resize', this.onResizeWindow)
    }
    onResizeWindow = () => {
        this.setState({
            vditorHeight: getVditorHeight()
        })
        console.log(getVditorHeight())
        this.resetVditoHeight()
    }
    resetVditoHeight = () => {
        this.setState({
            vditorHeight: getVditorHeight()
        })
    }
    openFile = async () => {
        const homeDirPath = await homeDir();
        let selected = await open({
            directory: true,
            multiple: false,
            defaultPath: homeDirPath,
        });
        await this.loadDir(selected, selected)
    }
    loadDir = async (rootDir, dir) => {
        let fileList = await simpleReadDir(dir, ".md")
        fileList = fmtFileList(fileList, this.state.currentDir)
        let tmp = getRelativePath(dir, rootDir)
        await this.setState({
            rootDir: rootDir,
            fileList: fileList,
            currentDir: dir,
            relativeDirs: genQuickDirs(tmp, rootDir)
        })
        this.restoreLoadConfig()
    }
    getContent = async (name) => {
        let data = await readFile(name)
        await this.setState({
            activeFile: name,
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
        this.restoreLoadConfig()
    }
    restoreLoadConfig = () => {
        setLoadConfig({
            rootDir: this.state.rootDir,
            currentDir: this.state.currentDir,
            activeFile: this.state.activeFile
        })
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
            height: getVditorHeight(),
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
    selectFile = async () => {
        this.setState({
            visible: true
        })
    }

    render() {
        return (
            <div className="app" onKeyUp={this.handleKeyUp}>

                <div style={{ height: this.state.vditorHeight, margin: '5px auto', width: '95%' }} ref={this.loadEditor} id="container-editor"></div>
                <Button onClick={this.selectFile}>选择</Button>

                <Drawer
                    title={<QuickDir relativeDirs={this.state.relativeDirs} />}
                    visible={this.state.visible}
                    closable={false}
                    height={'70%'}
                    footer={null}
                    escToExit={true}
                    maskClosable={true}
                    placement={'bottom'}
                    onCancel={() => {
                        this.setState({
                            visible: false
                        })
                    }}
                >
                    
                    <FileList fileList={this.state.fileList} rootDir={this.state.rootDir} activeFile={this.state.activeFile} currentDir={this.state.currentDir} />
                </Drawer>
            </div>
        )
    }
}

export default App

