import './App.css';
import React from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { IconObliqueLine } from '@arco-design/web-react/icon';
import { open } from '@tauri-apps/api/dialog';
import { ensureConfigDir, setActiveFileCache, deleteActiveFileCache, getLoadConfig, setLoadConfig } from './util/fs'
import { convertLocalImage } from './util/markdown'
import { fmtFileList, genQuickDirs } from './util/common'
import { writeFile, readFile, uploadFile, simpleReadDir, setWindowTitle } from './util/invoke'
import { Space, Link, Grid } from '@arco-design/web-react';
import { homeDir, join, sep as SEP } from '@tauri-apps/api/path';
import IconFolder from './asserts/svg/folder.js';
import IconMarkdown from './asserts/svg/markdown';
import Vditor from 'vditor'
import "vditor/dist/index.css";
import dayjs from 'dayjs';
import { listen } from '@tauri-apps/api/event'
const Row = Grid.Row;
const Col = Grid.Col;

const QuickDir = (props) => {
    if (props.relativeDirs == undefined || props.relativeDirs.length < 1) {
        return null
    }
    return <>
        <div style={{ overflowX: 'scroll' }}>
            <Space split={<IconObliqueLine />} align={'center'} size={0} style={{ marginRight: '0' }}>
                {
                    props.relativeDirs.map(item => {
                        if (item.static != undefined && item.static) {
                            return <strong style={{ fontSize: '20px' }}>{item.name}</strong>
                        }
                        return <Link onClick={() => props.quickSelect(item.path)} style={{ fontSize: '20px' }}>{item.name}</Link>
                    })
                }
            </Space>
        </div>
        <hr />
    </>
}
const FileList = (props) => {
    return <Row className="directory">
        {props.fileList.map(item => {
            if (item.item_type == 'dir') {
                return <Col className="directory-item" key={item.path} span={8} onClick={() => props.clickFile(item)} >
                    <IconFolder height={50} width={50} />
                    <span >{item.path}</span>
                </Col>
            }
            return <Col className="directory-item" key={item.path} span={8} onClick={() => props.clickFile(item)} >
                <IconMarkdown height={50} width={50} />
                <span>{item.path}</span>
            </Col>
        })}
    </Row>
}

const getMDHeight = () => {
    return window.innerHeight - 10
}


class App extends React.Component {
    vditor = null
    constructor(props) {
        super(props);
        this.state = {

            rootDir: '',
            fileList: [],

            activeFile: '',
            changed: false,

            relativeDirs: [],
            vditorHeight: 0,
            fileType: 'dir',
        }
    }
    async componentDidMount() {
        await ensureConfigDir()
        let object = await getLoadConfig()
        if (object != undefined) {
            await this.setState(object)
        }
        this.selectFile()
        window.addEventListener('resize', this.onResizeWindow)
    }
    onResizeWindow = () => {
        this.setState({
            vditorHeight: getMDHeight()
        })
        this.resetMDHeight()
    }
    resetMDHeight = () => {
        this.setState({
            vditorHeight: getMDHeight()
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
            relativeDirs: [],
        })
        await this.loadDir(selected, "dir")
    }
    loadDir = async (activeFile, fileType) => {
        if (fileType == "dir") {
            let fileList = await simpleReadDir(activeFile, ".md")
            fileList = fmtFileList(fileList, activeFile)
            await this.setState({
                fileList: fileList,
                activeFile: activeFile,
                fileType: fileType,
                relativeDirs: genQuickDirs(this.state.rootDir, activeFile),
            })
        } else {
            try {
                let data = await readFile(activeFile)
                let list = genQuickDirs(this.state.rootDir, activeFile)
                list[list.length - 1].static = true
                await this.setState({
                    activeFile: activeFile,
                    fileType: fileType,
                    fileList: [],
                    relativeDirs: list,
                })
                console.log(data)

                this.setVditorValue(data)
            } catch (e) {
                console.log(e)
            }
        }
        setWindowTitle(activeFile)
    }
    setVditorValue = (data) => {
        setTimeout(() => {
            this.vditor.setValue(data)
            this.convertImage()
        }, 300)
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
        let currentPath = await join(this.state.activeFile, item.path)
        await this.loadDir(currentPath, item.item_type)
        this.restore()
    }
    restore = () => {
        setLoadConfig({
            rootDir: this.state.rootDir,
            activeFile: this.state.activeFile,
            fileType: this.state.fileType
        })
    }
    quickSelect = async (relativePath) => {
        let currentDir = await join(this.state.rootDir, relativePath)
        if (relativePath == this.state.rootDir) {
            currentDir = this.state.rootDir
        }
        await this.loadDir(currentDir, "dir")
    }
    loadEditor = (ele) => {
        if (ele == null) {
            return
        }
        let opt = {
            height: getMDHeight(),
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
        let currentDir = this.state.currentDir
        if (this.state.rootDir.length > 0) {
            if (currentDir.length < 1) {
                currentDir = this.state.rootDir
            }
            await this.loadDir(currentDir)
        } else {
            this.openFile()
        }
    }

    render() {
        return (
            <div style={{ width: '90%', margin: '10px auto' }}>
                <QuickDir relativeDirs={this.state.relativeDirs} quickSelect={this.quickSelect} />
                {
                    this.state.fileType != 'dir' ? <div style={{ height: this.state.vditorHeight, }} ref={this.loadEditor} id="container-editor" ></div> : <FileList fileList={this.state.fileList} currentDir={this.state.currentDir} clickFile={this.clickFile} />
                }
            </div>
        )
    }
}

export default App

