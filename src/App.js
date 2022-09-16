import './App.css';
import React, {useEffect} from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { open } from '@tauri-apps/api/dialog';
import { getLatestLoadDir, setLatestLoadDir, ensureBaseDir } from './util/fs'
import { convertLocalImage } from './util/markdown'
import { writeFile, readFile, readDir, simpleReadDir, setWindowTitle } from './util/invoke'
import { Drawer, Button, Divider } from '@arco-design/web-react';
import { homeDir, join, resourceDir, sep as SEP } from '@tauri-apps/api/path';
import { IconDoubleRight } from '@arco-design/web-react/icon';
import IconFolder from './asserts/svg/folder.js';
import IconMarkdown from './asserts/svg/markdown';
import Vditor from 'vditor'
import "vditor/dist/index.css";

class App extends React.Component {
    vditor  = null
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

            relativeDirs: []
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
        setTimeout(() => {
            convertLocalImage(this.state.activeFile)
        }, 1000)
    }
    handleKeyUp = async (event) => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            await writeFile(this.state.activeFile, this.state.value)
            await this.setState({
                changed: false,
            })
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
        if(currentDir == rootDir) {
            return ''
        }
        return currentDir.substr(rootDir.length + 1)
    }
    genQuickDirs = (relativePath) => {
        if(relativePath.length < 1) {
            return []
        }
        let parts = relativePath.split(SEP)
        let list = [{
            path : '..',
            name : '主页'
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
        if(relativePath == "..") {
            currentDir = this.state.rootDir
        }
        await this.loadDir(currentDir);
    }
    loadEditor = (ele) => {
        console.log(ele);
        if(ele == null) {
            return
        }
        this.vditor = new Vditor("container-editor", {
            height:'100%',
            width:'95%',
        })
    }

    render() {
        return (
            <div className="app" onKeyUp={this.handleKeyUp}>
                <div type="primary" style={{
                    position:'fixed', height: '100%', width: '30px'
                }}>
                    <span style={{ position: 'absolute', top: 'calc(50% - 20px)', left: '5px', zIndex: '999' }} onClick={() => {
                        this.setState({
                            visible: true
                        })
                    }}>
                        <IconDoubleRight />
                    </span>
                    <Drawer
                        title={<div><p style={{
                            fontSize: '11px', color: 'gray'
                        }}>{this.state.rootDir}<Button size="mini" onClick={this.openFile}>open</Button></p></div>}
                        visible={this.state.visible}
                        closable={false}
                        width={'30%'}
                        footer={null}
                        escToExit={true}
                        maskClosable={true}
                        onOk={() => {
                            this.setState({
                                visible: true
                            })
                        }}

                        placement={'left'}
                        onCancel={() => {
                            this.setState({
                                visible: false
                            })
                        }}
                    >
                        {this.state.fileList.length < 1 && this.state.currentDir.length < 1 ? <div style={{ paddingTop: '30%', textAlign: 'center' }}>
                            <Button type="primary" onClick={this.openFile}>打开文件夹</Button>
                        </div> : ''}
                        {
                            this.state.relativeDirs.map((item, i) => {
                                return <a href="javascript:;" onClick={this.quickSelect.bind(this, item.path)}>{item.name} {i < this.state.relativeDirs.length-1 ? '/' : ''}</a>
                            })
                        }

                        {this.state.fileList.map(item => {
                            return <p style={{
                                verticalAlign: 'middle'
                            }}>{item.item_type == 'dir' ? <IconFolder height={25} width={25} /> : <IconMarkdown height={25} width={25} />}
                                <a style={{ marginLeft: '10px' }} href="javascript:;" onClick={this.clickFile.bind(this, item)}>{item.path}</a></p>
                        })}

                    </Drawer>

                </div>
                <div style={{margin:'0 auto'}} ref={this.loadEditor} id="container-editor">
                </div>

            </div>
        );
    }
}

export default App
