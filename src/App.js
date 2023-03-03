import './App.css';
import 'bytemd/dist/index.css'
import React, { useState } from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { IconObliqueLine, IconFolder, IconFile, IconEdit, IconSave } from '@arco-design/web-react/icon';
import { open } from '@tauri-apps/api/dialog';
import { mkConfigDir, setActiveFileCache, deleteActiveFileCache, getLoadConfig, setLoadConfig } from './util/fs'
import { convertLocalImage } from './util/markdown'
import { fmtFileList, genQuickDirs } from './util/common'
import { writeFile, readFile, uploadFile, simpleReadDir, setWindowTitle, createDir, createFile } from './util/invoke'
import { Space, Link, Grid, Button, Popconfirm, Message, Input, Modal } from '@arco-design/web-react';
import { homeDir, join } from '@tauri-apps/api/path';
import IconFolderSVG from './asserts/svg/folder.js';
import IconMarkdown from './asserts/svg/markdown';
import dayjs from 'dayjs';
import { listen } from '@tauri-apps/api/event'
import { Editor, Viewer } from '@bytemd/react'
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import gfm from '@bytemd/plugin-gfm'
const Row = Grid.Row;
const Col = Grid.Col;
const ButtonGroup = Button.Group;
const plugins = [gfm(), highlight(), mermaid()]
const QuickDirMaxLevel = 5
const QuickDir = (props) => {
    if (props.relativeDirs == undefined || props.relativeDirs.length < 1) {
        return null
    }
    return <>
        <Row>
            <Col span={20}>
                <Space split={<IconObliqueLine />} align={'center'} size={0} style={{ marginRight: '0' }}>
                    {
                        props.relativeDirs.map(item => {
                            if (item.static != undefined && item.static) {
                                return <>
                                    <strong style={{ fontSize: '20px', marginRight: '5px' }}>{item.name}</strong>
                                    {
                                        props.mode == 'view' ? <IconEdit onClick={props.setEditMode} /> : <IconSave onClick={props.saveContent} />
                                    }

                                </>
                            }
                            return <Link onClick={() => props.quickSelect(item.path)} style={{ fontSize: '20px' }}>{item.name}</Link>
                        })
                    }

                </Space>
            </Col>
            <Col span={4} style={{ textAlign: 'right' }}>
                {props.addon}
            </Col>
        </Row>
        <hr />
    </>
}
const FileList = (props) => {
    return <Row className="directory">
        {props.fileList.map(item => {
            return <Col className="directory-item" key={item.path} span={8} onClick={() => props.clickFile(item)} >
                {
                    item.item_type == 'dir' ? <IconFolderSVG height={50} width={50} /> : <IconMarkdown height={50} width={50} />
                }
                <span >{item.path}</span>
            </Col>
        })}
        {props.addon ? props.addon : null}
    </Row>
}

const CreateNew = (props) => {
    const { newDirName, setNewDirName } = useState("")
    const { newFileName, setNewFileName } = useState("")
    return <ButtonGroup>
        <Popconfirm
            title={null}
            icon={null}
            content={
                <Input placeholder="请输入文件夹名" value={newDirName} onChange={setNewDirName} />
            }
            onOk={props.createDir(newDirName)}
        >
            <Button><IconFolder /></Button>
        </Popconfirm>

        <Popconfirm
            title={null}
            icon={null}
            content={
                <Input placeholder="请输入文件名" value={newFileName} onChange={setNewFileName} />
            }
            onOk={props.createFile}
        ><Button><IconFile /></Button></Popconfirm>
    </ButtonGroup>
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
            value: '',
            changed: false,

            relativeDirs: [],
            vditorHeight: 0,
            fileType: 'dir',

            newDirName: "",
            newFileName: '',
            mode: ''
        }
    }
    async componentDidMount() {
        await mkConfigDir()
        let object = await getLoadConfig()
        this.initSelectFile(object)
       
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
                relativeDirs: genQuickDirs(this.state.rootDir, activeFile, QuickDirMaxLevel),
                mode: 'view'
            })
        } else {
            try {
                let data = await readFile(activeFile)
                let list = genQuickDirs(this.state.rootDir, activeFile, QuickDirMaxLevel)
                list[list.length - 1].static = true
                await this.setState({
                    activeFile: activeFile,
                    fileType: fileType,
                    fileList: [],
                    relativeDirs: list,
                    mode: 'view'
                })

                this.renderMD(data)
            } catch (e) {
                console.log(e)
            }
        }
        setLoadConfig({
            rootDir: this.state.rootDir,
            activeFile: activeFile,
            fileType: fileType
        })
        setWindowTitle(activeFile)
    }
    renderMD = async (data) => {
        await this.setState({
            value: data
        })
    }
    convertImage = () => {
        setTimeout(() => {
            convertLocalImage(this.state.activeFile)
        }, 1000)
    }
    handleKeyUp = async (event) => {
        if (this.state.fileType == 'dir' || this.state.mode == 'view') {
            return
        }
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.saveFile();
        }
    }
    saveFile2View = async () => {
        await this.saveFile()
        this.setState({
            mode : 'view'
        })
    }
    saveFile = async () => {
        if(!this.state.changed) {
            return
        }
        let result = await writeFile(this.state.activeFile, this.state.value)
        await this.setState({
            changed: false,
        })
        Message.success("保存成功")
        await setWindowTitle(this.state.activeFile)
        await deleteActiveFileCache(this.state.activeFile)
    }
    clickFile = async (item) => {
        let currentPath = await join(this.state.activeFile, item.path)
        await this.loadDir(currentPath, item.item_type)
    }
    quickSelect = async (relativePath) => {
        if (this.state.changed) {
            return await this.ask2Save(relativePath)
        }
        let currentDir = await join(this.state.rootDir, relativePath)
        if (relativePath == this.state.rootDir) {
            currentDir = this.state.rootDir
        }
        await this.loadDir(currentDir, "dir")
    }
    ask2Save = async (relativePath) => {
        await Modal.confirm({
            simple: true,
            title: "保存提示",
            content: "当前编辑的文档还未保存？请选择",
            okText: "是，立马保存",
            cancelText: "否，我要放弃",
            onOk: async () => {
                await this.saveFile()
                await this.quickSelect(relativePath)
            },
            onCancel: async () => {
                await this.quickSelect(relativePath)
            }
        })
    }
    onInput = async (str) => {
        await this.setState({
            changed: true
        })
        setWindowTitle(this.state.activeFile + '(有修改)')
        await setActiveFileCache(this.state.activeFile, str)
    }
    uploadImage = async (files) => {
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
    initSelectFile = async (object) => {
        console.log(object)
        if(object == undefined || object.rootDir.length < 1) {
            this.openFile()
            return
        }
        let activeFile = object.activeFile
        if (object.rootDir.length > 0) {
            if (activeFile.length < 1) {
                activeFile = object.rootDir
            }
            await this.setState({
                rootDir : object.rootDir,
            })
            await this.loadDir(activeFile, object.fileType)
        }
    }
    createDir = async (newDir) => {
        let fullPath = await join(this.state.activeFile, newDir)
        let result = await createDir(fullPath)
        console.log(result)
        if (result == 'ok') {
            Message.success("successfully created!!")
            this.loadDir(this.state.activeFile, "dir")
        } else {
            Message.error(result)
        }
    }
    createFile = async (newFile) => {
        let fullPath = await join(this.state.activeFile, newFile)
        let result = await createFile(fullPath)
        if (result == 'ok') {
            Message.success("successfully created!!")
            this.loadDir(this.state.activeFile, "dir")
        } else {
            Message.error(result)
        }
    }

    render() {
        return (
            <div style={{ width: '90%', margin: '10px auto' }} onKeyUp={this.handleKeyUp} id="app">
                <QuickDir
                    relativeDirs={this.state.relativeDirs}
                    quickSelect={this.quickSelect}
                    mode={this.state.mode}
                    setEditMode={() => {
                        this.setState({
                            mode: 'edit'
                        })
                    }}
                    saveContent={this.saveFile2View}
                    addon={this.state.fileType == 'dir' ?
                        <CreateNew createDir={this.createDir} createFile={this.createFile} /> : null
                    } />
                {
                    this.state.fileType == 'dir' ? <FileList fileList={this.state.fileList} currentDir={this.state.currentDir} clickFile={this.clickFile} /> : null
                }

                {
                    this.state.fileType == 'file' && this.state.mode == 'edit' ? <Editor
                        value={this.state.value}
                        plugins={plugins}
                        mode="auto"
                        onChange={(v) => {
                            this.onInput(v)
                        }} /> : null
                }

                {
                    this.state.fileType == 'file' && this.state.mode == 'view' ? <Viewer value={this.state.value} plugins={plugins} /> : null
                }

            </div>
        )
    }
}

export default App