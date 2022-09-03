import 'bytemd/dist/index.css'
import './App.css';
import { Editor, Viewer } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import React from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/api/dialog';
import { desktopDir, join } from '@tauri-apps/api/path';
import { Layout, Tree, Button } from '@arco-design/web-react';
const Sider = Layout.Sider;
const Content = Layout.Content;
const TreeNode = Tree.Node;

const plugins = [
    gfm(),
    highlight(),
    mermaid(),
]

class App extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            value: '',
            files: [],
            treeData: [],
            dir: "",
            cursor: null,
        }
    }
    async componentDidMount() {
        var fet = Object.getOwnPropertyDescriptor(Image.prototype, 'onload')
        console.log(fet, Image.prototype)
        Object.defineProperty(Image.prototype, 'onloadeddata', {
            value: function (event) {
                console.log(event);
            }
        })
    }
    addImageLoadListener = async () => {
        var eles = document.getElementsByTagName('img')
        console.log(eles)

        /*let eles = document.getElementsByTagName('img')
        console.log(eles, Object.keys(eles), eles.length)
        */
        for (let ele of eles) {
            let fullURL = ele.src
            let prefixLength = ele.baseURI.length
            let assetUrl = await join(this.state.dir, fullURL.substring(prefixLength));
            ele.src = convertFileSrc(assetUrl);
        }
        /*
        document.addEventListener("error", function (e) {
            console.log(e)
        }, true);*/
    }
    imageLoad = async (event) => {
        console.log(event)
    }
    openFile = async () => {
        let selected = await open({
            directory: true,
            multiple: false,
            defaultPath: '',
        });
        await this.setState({
            dir: selected,
        })
        await this.loadDir(selected)
    }
    loadDir = async (dir) => {
        let data = await invoke('get_md_list', {
            dir
        })

        await this.setState({
            treeData: [this.fmt2TreeData(data)],
        })
    }
    getContent = async (name) => {
        let data = await invoke('get_md_content', {
            name: name
        })
        await this.setState({
            value: data
        })
        setTimeout(() => {
            this.addImageLoadListener()
        }, 1000)
        
        //console.log(data)
    }
    fmt2TreeData = (data) => {
        let mapData = {
            name: this.state.dir,
            title: this.state.dir,
            toggled: true,
            key: this.state.dir,
            children: []
        }
        let prefixLength = this.state.dir.length + 1
        for (var i in data) {
            let path = data[i].substr(prefixLength)
            let parts = path.split("\\")
            mapData = this.put2RightPlace(mapData, parts, this.state.dir, 0)
        }
        //console.log(mapData)
        return mapData
    }
    put2RightPlace = (retData, parts, uriPrefix, level) => {
        if (parts.length < 1) {
            return retData
        }
        //console.log(retData, parts, uriPrefix)
        if (parts.length == 1) {
            retData.children.push({
                name: parts[0],
                title: parts[0],
                key: uriPrefix + '\\' + parts[0],
                type: 'file',
            })
        } else {
            let index = -1
            for (var i in retData.children) {
                if (retData.children[i].name == parts[0]) {
                    index = i
                }
            }
            if (index < 0) {
                retData.children.push({
                    name: parts[0],
                    title: parts[0],
                    key: uriPrefix + '\\' + parts[0],
                    children: [],
                    toggled: level == 0 ? true : false
                })
                index = retData.children.length - 1
            }
            retData.children[index] = this.put2RightPlace(retData.children[index], parts.splice(1), uriPrefix + '\\' + parts[0], level + 1)
        }
        return retData
    }
    onToggle = async (node, toggled) => {
        const { cursor, treeData } = this.state;
        if (cursor) {
            cursor.active = false
            await this.setState({
                cursor
            })
        }
        node.active = true;
        if (node.children) {
            node.toggled = toggled;
        }
        this.setState(() => ({ cursor: node, treeData: Object.assign({}, treeData) }));
        if (node.dir != undefined) {
            await this.getContent(node.dir)
        }
    }
    onSelect = async (node, value) => {
        if (node[0].substr(node[0].length - 3, 3) == '.md') {
            await this.getContent(node[0])
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
                    <Content>
                        <Editor
                            value={this.state.value}
                            plugins={plugins}
                            placeholder={'Enjoy your writting'}
                            onChange={(v) => {
                                this.setState({
                                    value: v
                                })
                            }}
                            style={{
                                height: '100%'
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