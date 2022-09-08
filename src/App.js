import 'bytemd/dist/index.css'
import './App.css';
import { Editor } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import React from 'react';
import "@arco-design/web-react/dist/css/arco.css";
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/api/dialog';
import  { homeDir, join, basename, sep as SEP } from '@tauri-apps/api/path';
import { writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
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
            treeData: [],
            dir: "",
            cursor: null,
            activeFile: '',
            changed: false,
        }
    }
    async componentDidMount() {}
    addImageLoadListener = async () => {
        var eles = document.getElementsByTagName('img')
        for (let ele of eles) {
            let fullURL = ele.src
            let prefixLength = ele.baseURI.length
            let assetUrl = await join(this.state.dir, fullURL.substring(prefixLength));
            ele.src = convertFileSrc(assetUrl);
        }
    }
    saveMarkdown = async (file, content) => {

        let data = await invoke('write_md', {
            name : file, content : content,
        })
        console.log(data)
        return
        let fileName = await basename(file)
        let dir = file.substring(0, file.length - fileName.length)
        console.log(file, content, dir, fileName, BaseDirectory.App)
        await writeTextFile({ path: fileName, contents: content }, { dir: dir });
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
       //alert(name)
       //return
        let data = await invoke('get_md_content', {
            name: name
        })
        await this.setState({
            value: data,
            activeFile: name,
            changed: false,
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
            let parts = path.split(SEP)
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
                key: uriPrefix + SEP + parts[0],
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
                    key: uriPrefix + SEP + parts[0],
                    children: [],
                    toggled: level == 0 ? true : false
                })
                index = retData.children.length - 1
            }
            retData.children[index] = this.put2RightPlace(retData.children[index], parts.splice(1), uriPrefix + SEP + parts[0], level + 1)
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
    handleKeyUp = async (event) => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            // do some saving
            // props.handleSave && props.handleSave(value);
            event.preventDefault();

            // remove test log when api called
            console.log("should save code");
            await this.saveMarkdown(this.state.activeFile, this.state.value)
            await this.setState({
                changed : false,
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