import 'bytemd/dist/index.css'
import './App.css';
import { Editor } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import React from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/api/dialog';
import { getLatestLoadDir, setLatestLoadDir, ensureBaseDir } from './util/fs'
import { convertLocalImage, fmtFilesAsTreeData } from './util/markdown'
import { writeFile, readFile, readDir } from './util/invoke'
import { Layout, Tree, Button } from '@arco-design/web-react';
import { homeDir, sep as SEP } from '@tauri-apps/api/path';

const Sider = Layout.Sider;
const Content = Layout.Content;

const plugins = [gfm(), highlight(), mermaid()]


class App extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            value: '',
            treeData: [],
            dir: "",
            cursor: null,
            activeFile: '',
            changed: false,
        }
    }
    async componentDidMount() {
        await ensureBaseDir()
        let latestDir = await getLatestLoadDir()
        if (latestDir.length > 0) {
            await this.setState({
                dir: latestDir
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
            dir: selected,
        })
        await setLatestLoadDir(selected)
        await this.loadDir(selected)
    }
    loadDir = async (dir) => {
        let fileList = await readDir(dir, ".md")
        await this.setState({
            treeData: [fmtFilesAsTreeData(this.state.dir, fileList)],
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
    onSelect = async (node, value) => {
        if (node[0].substr(node[0].length - 3, 3) == '.md') {
            await this.getContent(node[0])
        }
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

    render() {
        return (
            <div className="app">
                <Layout>
                    <Sider
                        resizeDirections={['right']}
                        style={{
                            minWidth: 240,
                            maxWidth: 350,
                            height: '100vh',
                            overflow: 'scroll'
                        }}
                        size="small"
                    >
                        {this.state.treeData.length > 0 ? <Tree defaultSelectedKeys={[]} treeData={this.state.treeData} onSelect={this.onSelect}></Tree> : <div style={{ paddingTop: '40%', textAlign: 'center' }}>
                            <Button type="primary" onClick={this.openFile}>打开文件夹</Button>
                        </div>}
                    </Sider>
                    <Content onKeyUp={this.handleKeyUp}>
                        <p className="title">{this.state.activeFile}{this.state.changed ? '(有修改)' : ''}</p>
                        <Editor
                            value={this.state.value}
                            plugins={plugins}
                            placeholder={'Enjoy your writting'}
                            onChange={(v) => {
                                this.setState({
                                    value: v,
                                    changed: true
                                })
                            }}
                            mode={'tab'}
                        />
                    </Content>
                </Layout>
            </div>
        );
    }
}

export default App