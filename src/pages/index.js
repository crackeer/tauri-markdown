import React from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { IconEdit, IconSave, IconArrowUp } from '@arco-design/web-react/icon';
import { Button, Message, Affix, Modal, BackTop } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import { listen } from '@tauri-apps/api/event'
import Editor from '@/component/MDEditor';
import Viewer from '@/component/MDViewer';
import FileList from '@/component/FileList';
import QuickDir from '@/component/QuickDir';
import { writeFile, readFile, simpleReadDir, setWindowTitle } from '../util/invoke'
import { fmtFileList } from '@/util/common';
import utilFs from '../util/fs'

var theWindow = null
var tauriApiPath = null

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
            fileList: [],
            activeFile: '',
            value: '',
            changed: false,
            fileType: 'dir',
            mode: ''
        }
    }
    async componentDidMount() {
        
        theWindow = await require('@tauri-apps/api/window')
        tauriApiPath = await import('@tauri-apps/api/path')
        let object = await utilFs.getLoadConfig()
        this.initSelectFile(object)
        this.listen()
    }
    openFile = async () => {
        const homeDirPath = await tauriApiPath.homeDir();
        let selected = await open({
            directory: true,
            multiple: false,
            defaultPath: homeDirPath,
        });
        if (selected == null || selected.length < 1) {
            return
        }
        await this.setState({
            rootDir: selected,
        })
        await this.loadDir(selected, "dir")
    }
    reload = async () => {
        this.loadDir(this.state.activeFile, this.state.fileType)
    }
    loadDir = async (activeFile, fileType) => {
        if (fileType == "dir") {
            let fileList = await simpleReadDir(activeFile, ".md")
            fileList = fmtFileList(fileList, activeFile, tauriApiPath.sep)
            await this.setState({
                fileList: fileList,
                activeFile: activeFile,
                fileType: fileType,
                mode: 'view'
            })
            this.updateSelf()
            return
        }
        try {
            let data = await readFile(activeFile)
            await this.setState({
                activeFile: activeFile,
                fileType: fileType,
                fileList: [],
                value: data,
                mode: 'view'
            })
            this.updateSelf()
        } catch (e) {
            console.log("read file error", activeFile, e)
        }
    }
    updateSelf = async () => {
        setWindowTitle(this.state.activeFile)
        utilFs.setLoadConfig({
            rootDir: this.state.rootDir,
            activeFile: this.state.activeFile,
            fileType: this.state.fileType,
            mode: this.state.mode,
        })
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
            mode: 'view'
        })
    }
    saveFile = async () => {
        if (!this.state.changed) {
            return
        }
        let result = await writeFile(this.state.activeFile, this.state.value)
        await this.setState({
            changed: false,
        })
        Message.success("保存成功")
        await setWindowTitle(this.state.activeFile)
    }
    clickFile = async (item) => {
        let absPath = await tauriApiPath.join(this.state.activeFile, item.path)
        await this.loadDir(absPath, item.item_type)
    }
    quickSelect = async (relativePath) => {
        if (this.state.changed) {
            return await this.ask2Save(relativePath)
        }
        let currentDir = await tauriApiPath.join(this.state.rootDir, relativePath)
        if (relativePath == this.state.rootDir) {
            currentDir = this.state.rootDir
        }
        await this.loadDir(currentDir, "dir")
    }
    ask2Save = async (relativePath, action) => {
        await Modal.confirm({
            simple: true,
            title: "保存提示",
            content: "当前编辑的文档还未保存？请选择",
            okText: "是，立马保存",
            cancelText: "否，我要放弃",
            onOk: async () => {
                await this.saveFile()
                if (action == "close") {
                    await theWindow.appWindow.close();
                } else {
                    await this.quickSelect(relativePath)
                }
            },
            onCancel: async () => {
                await this.setState({
                    changed: false
                })
                if (action == "close") {
                    await theWindow.appWindow.close();
                } else {
                    await this.quickSelect(relativePath)
                }
            }
        })
    }
    onInput = async (str) => {
        await this.setState({
            changed: true,
            value: str
        })
        setWindowTitle(this.state.activeFile + '(changed)')
    }
    initSelectFile = async (object) => {
        if (object == undefined || object.rootDir == undefined || object.rootDir.length < 1) {
            //this.openFile()
            return
        }
        let activeFile = object.activeFile
        if (object.rootDir.length > 0) {
            if (activeFile.length < 1) {
                activeFile = object.rootDir
            }
            await this.setState({
                rootDir: object.rootDir,
            })
            await this.loadDir(activeFile, object.fileType)
        }
    }
    listen = async () => {
        await listen('open_folder', (event) => {
            this.openFile()
        })
        theWindow.appWindow.onCloseRequested(async (event) => {
            if (this.state.mode == 'edit' && this.state.changed) {
                this.ask2Save("", "close")
                event.preventDefault()
            }
        });
    }

    render() {
        if (this.state.rootDir.length < 1) {
            return <div style={{ margin: '20% auto', textAlign: 'center' }}>
                <Button onClick={this.openFile} type="primary">Open Folder</Button>
            </div>
        }
        return (
            <div onKeyUp={this.handleKeyUp} id="app">
                <Affix offsetTop={0}>
                    <QuickDir
                        rootDir={this.state.rootDir}
                        activeFile={this.state.activeFile}
                        sep={tauriApiPath.sep}
                        quickSelect={this.quickSelect}
                        fileType={this.state.fileType}
                        reload={this.reload}
                    />
                </Affix>

                <ContentViewer context={this.state} method={{
                    clickFile: this.clickFile,
                    onInput: this.onInput,
                }}></ContentViewer>


                <div style={{ position: 'fixed', bottom: '50px', textAlign: 'center', right: '20px' }}>
                    <ContentAction context={this.state} method={{
                        setMode: (value) => {
                            this.setState({
                                mode: value
                            })
                        },
                        saveFile: this.saveFile2View,
                    }}></ContentAction>
                </div>
            </div>
        )
    }
}

export default App


const ContentViewer = ({ context, method }) => {
    if (context.fileType == 'dir') {
        return <FileList data={context.fileList} clickFile={method.clickFile} />
    }
    if (context.mode == 'edit') {
        return <>
            <Editor value={context.value} onChange={method.onInput} sep={tauriApiPath.sep} activeFile={context.activeFile} />
        </>
    }
    return <>
        <Viewer value={context.value} sep={tauriApiPath.sep} activeFile={context.activeFile} />
    </>
}

const ContentAction = ({ context, method }) => {
    if (context.fileType == 'dir') {
        return null
    }
    if (context.mode == 'edit') {
        return <div>
            <Button onClick={method.saveFile} icon={<IconSave />} shape='round' type='primary' size='large'></Button>
        </div>
    }
    return <div>
        <div>
            <Button onClick={() => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                })
            }} icon={<IconArrowUp />} shape='round' size='large'></Button>
        </div>
        <div style={{ marginTop: '10px' }}>
            <Button onClick={() => {
                method.setMode('edit')
            }} icon={<IconEdit />} shape='round' type='primary' size='large'></Button>
        </div>
    </div>
}
