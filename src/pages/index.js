import React from 'react';
import { IconEdit, IconSave, IconArrowUp } from '@arco-design/web-react/icon';
import { Button, Message, Modal, Layout, Affix } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import { listen } from '@tauri-apps/api/event'
import Markdown from '@/component/Markdown';
import TreeDirectory from '@/component/TreeDirectory';
import { writeFile, readFile, simpleReadDir, setWindowTitle } from '../util/invoke'
import utilFs from '../util/fs'

const Sider = Layout.Sider;
const Content = Layout.Content;
var theWindow = null
var tauriApiPath = null

class App extends React.Component {
    tree = null;
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
            currentDir: '',
            activeFile: '',
            value: '',
            changed: false,
            fileType: 'dir',
            mode: '',
            firstSetValue : false,
        }
        this.tree = React.createRef()
    }
    updateWindowTitle () {
        setWindowTitle(this.state.rootDir)
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
        this.tree.current.initData(selected)
        this.updateWindowTitle()
    }
    clickFileX = async (file) => {
        if(this.state.changed) {
            this.ask2Save(file, "")
            return 
        }
        let data = await readFile(file)
        await this.setState({
            activeFile: file,
            fileType: "file",
            value: data,
            changed: false,
            firstSetValue : true,
        })
        this.updateSelf()
    }
    updateSelf = async () => {
        utilFs.setLoadConfig({
            rootDir: this.state.rootDir,
            activeFile: this.state.activeFile,
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
    }
    ask2Save = async (activeFile, action) => {
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
                    await this.clickFileX(activeFile)
                }
            },
            onCancel: async () => {
                await this.setState({
                    changed: false
                })
                if (action == "close") {
                    await theWindow.appWindow.close();
                } else {
                    await this.clickFileX(activeFile)
                }
            }
        })
    }
    onInput = async (str) => {
        if(this.state.firstSetValue) {
            await this.setState({
                firstSetValue : false,
            })
            return
        }
        console.log("OnInput", str)
        await this.setState({
            changed: true,
            value: str
        })
    }
    initSelectFile = async (object) => {
        if (object == undefined || object.rootDir == undefined || object.rootDir.length < 1) {
            return
        }
        await this.setState(object)
        this.updateWindowTitle()
        if (object.activeFile) {
            this.clickFileX(object.activeFile)
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
            <div id="app">
                <Layout className='layout-body'>
                    <Sider
                        resizeDirections={['right']}
                        style={{
                            minWidth: '20%',
                            maxWidth: '40%',
                            height: '100vh',
                            overflow: 'scroll',
                            overflowX: 'hidden',
                            paddingLeft: '10px'
                        }}
                        size="small"
                    >
                        <TreeDirectory rootDir={this.state.rootDir} clickFile={this.clickFileX} ref={this.tree} />
                    </Sider>
                    <Content onKeyUp={this.handleKeyUp}>
                        <Affix offsetTop={1}>
                            <div className='content-title'>{this.state.activeFile}</div>
                        </Affix>
                        <div className="content">
                            <Markdown mode={this.state.mode} value={this.state.value} onChange={this.onInput} />
                        </div>
                    </Content>
                </Layout>

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


const ContentAction = ({ context, method }) => {
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
