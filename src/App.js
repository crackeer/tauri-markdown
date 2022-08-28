import 'bytemd/dist/index.css'
import './App.css';
import { Editor, Viewer } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import React from 'react';
import { Treebeard } from 'react-treebeard';
import { invoke } from '@tauri-apps/api/tauri'
import lodash, { includes } from 'lodash';
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/api/dialog';
import { desktopDir } from '@tauri-apps/api/path';
// listen to the `click` event and get a function to remove the event listener
// there's also a `once` function that subscribes to an event and automatically unsubscribes the listener on the first event


const plugins = [
    gfm(),
]

class App extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            value: '',
            files: [],
            treeData: {},
            dir: "",
            cursor: null,
        }
    }
    async componentDidMount() {
        listen('open', this.openFile.bind(this))
    }
    openFile = async (event) => {
        let selected = await open({
            directory: true,
            multiple: false,
            defaultPath: '',
        });
        await this.setState({
            dir : selected,
        })
        await this.loadDir(selected)
    }
    loadDir = async (dir) => {
        let data = await invoke('get_md_list', {
            dir
        })

        await this.setState({
            treeData: this.fmt2TreeData(data),
        })
    }
    getContent = async (name) => {
        let data = await invoke('get_md_content', {
            name: name
        })
        await this.setState({
            value: data
        })
        console.log(data)
    }
    fmt2TreeData = (data) => {
        let mapData = {
            name: this.state.dir,
            toggled: true,
            children: []
        }
        let prefixLength = this.state.dir.length + 1
        for (var i in data) {
            let path = data[i].substr(prefixLength)
            let parts = path.split("\\")
            mapData = this.put2RightPlace(mapData, parts, this.state.dir, 0)
        }
        console.log(mapData)
        return mapData
    }
    put2RightPlace = (retData, parts, uriPrefix, level) => {
        if (parts.length < 1) {
            return retData
        }
        console.log(retData, parts, uriPrefix)
        if (parts.length == 1) {
            retData.children.push({
                name: parts[0],
                dir: uriPrefix + '\\' + parts[0],
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
        console.log(node, toggled)
        this.setState(() => ({ cursor: node, treeData: Object.assign({}, treeData) }));
        if (node.dir != undefined) {
            await this.getContent(node.dir)
        }

    }
    onSelect = async (node) => {
        const { cursor, treeData } = this.state;

        if (cursor) {
            //this.setState(() => ({ cursor, active: false }));
            if (!includes(cursor.children, node)) {
                cursor.toggled = false;
                cursor.selected = false;
            }
            cursor.active = false
            await this.setState({
                cursor
            })
        }

        node.selected = true;

        await this.setState({ cursor: node, treeData: Object.assign({}, treeData) });
        console.log(node, node.dir)
        await this.getContent(node.dir)
    }

    render() {
        return (
            <div className="app">
                <div id="list" style={{ width: '20%', height: '100%', overflow: 'scroll' }}>
                    <Treebeard
                        data={this.state.treeData}
                        onToggle={this.onToggle}
                        onSelect={this.onSelect}
                    />
                </div>
                <div style={{ width: '80%' }}>
                    <Editor
                        value={this.state.value}
                        plugins={plugins}
                        onChange={(v) => {
                            this.setState({
                                value: v
                            })
                        }}
                        style={{
                            height: '100%'
                        }}
                    />
                </div>

            </div>
        );
    }
}

export default App