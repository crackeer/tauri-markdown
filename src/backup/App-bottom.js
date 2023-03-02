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
            return <div className={item.abs_path == props.activeFile ? 'directory-item directory-item-md directory-item-active' : 'directory-item directory-item-md'} key={item.abs_path}>
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
            this.getContent(object.activeFile)
            this.setState(object)
        }
        window.addEventListener('resize', this.onResizeWindow)
    }
    onResizeWindow = () => {
        this.setState({
            vditorHeight: getVditorHeight()
        })
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
            relativeDirs: genQuickDirs(tmp, rootDir),
        })
    }
    getContent = async (name) => {
        try {
            let data = await readFile(name)
            await this.setState({
                activeFile: name,
            })
            setWindowTitle(name)
            this.setVditorValue(data)
        } catch (e) {
            console.log(e)
        }
    }
    setVditorValue = (data) => {
        if (this.vditor != null) {
            this.vditor.setValue(data)
            this.convertImage()
        } else {
            setTimeout(() => {
                this.vditor.setValue(data)
                this.convertImage()
            }, 300)
        }
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
        if (ele == null) {
            return
        }
        let opt = {
            height: getVditorHeight(),
            upload: {
                handler: this.uploadImage
            },
            cache: {
                enable: false
            },
            icon: 'material',
            input: this.onInput
        }
       
        this.vditor = new Vditor("container-editor", opt)
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
        await this.setState({
            visible: true
        })
        let currentDir = this.state.currentDir
        let rootDir = this.state.rootDir
        if (this.state.rootDir.length > 0) {
            if (currentDir.length < 1) {
                currentDir = rootDir
            }
            await this.loadDir(rootDir, currentDir)
            return
        } else {
            this.openFile()
        }
    }

    render() {
        return (
            <div className="app" onKeyUp={this.handleKeyUp}>
                <div style={{ margin: '5px auto', width: '80%' }}>
                    <div style={{ height: this.state.vditorHeight, }} ref={this.loadEditor} id="container-editor"></div>
                </div>
                <div style={{ position: 'fixed', right: '10px', top: '10px' }}>
                    <Button type="primary" onClick={this.selectFile}>打开</Button>
                </div>

                <Drawer
                    title={<QuickDir relativeDirs={this.state.relativeDirs} quickSelect={this.quickSelect} />}
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
                    <FileList fileList={this.state.fileList} rootDir={this.state.rootDir} activeFile={this.state.activeFile} currentDir={this.state.currentDir} openFile={this.openFile} clickFile={this.clickFile} />
                </Drawer>
            </div>
        )
    }
}

export default App

