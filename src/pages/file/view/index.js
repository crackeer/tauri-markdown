import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Modal, List, Link, Space, Message } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import JSONView from '@/component/JSONView';
import JSONEditor from '@/component/JSONEditor';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import MDViewer from '@/component/MDViewer';
import MDEditor from '@/component/MDEditor';
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(import("react-monaco-editor"), { ssr: false });

class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            activeFile: '',
            mode: 'view',
            value: null,
            viewHeight: 0,
        }
    }
    async componentDidMount() {
        let file = common.getQuery("file")
        let mode = common.getQuery("mode", "view");
        await this.setState({
            activeFile: file,
        })
        cache.addOpenFiles([file])
        this.loadFile(file, mode)
    }
    htmlTitle = () => {
        return <h3><Space>
            {this.state.activeFile}
            <Button onClick={this.switchEdit} type='primary'>{this.state.mode == 'view' ? '编辑' : '查看'}</Button>
        </Space></h3>
    }
    loadFile = async (item, mode) => {
        let content = await invoke.readFile(item)
        let fileType = common.detectFileType(item)
        if (fileType == common.FileTypeJSON) {
            await this.loadJSON(content, mode)
        } else if (fileType == common.FileTypeMarkdown) {
            await this.loadMarkdown(content, mode)
        } else {
            await this.loadDefault(content, fileType)
        }
        this.props.updateTitle()
    }
    loadJSON = async (content, mode) => {
        try {
            let value = JSON.parse(content)
            await this.setState({
                value: value,
                file_type: 'json',
                mode: mode,
                viewHeight: common.getViewHeight()
            })

        } catch (e) {
            Message.error(e.message)
        }
    }
    loadMarkdown = async (content, mode) => {
        await this.setState({
            value: content,
            file_type: 'markdown',
            mode: mode,
            viewHeight: common.getViewHeight()
        })
    }
    loadDefault = async (content, fileType) => {
        await this.setState({
            value: content,
            file_type: fileType,
            mode: 'view',
            viewHeight: common.getViewHeight()
        })
    }
    switchEdit = async () => {
        await this.setState({
            mode: this.state.mode === 'view' ? 'edit' : 'view'
        })
        /*
        setTimeout(() => {
            this.editor.initValue(this.state.activeFile, this.state.value)
        }, 4000)*/

        this.props.updateTitle()
    }
    changeJSON = async (value) => {
        try {
            let json = JSON.parse(value)
            await this.setState({ value: json })
            console.log(json)
        } catch (e) {

        }
    }
    changeText = async (value) => {
        await this.setState({ value: value })
    }
    handleKeyUp = async (event) => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (this.state.mode === "edit") {
                let content = this.state.value
                if (this.state.file_type == 'json') {
                    content = JSON.stringify(this.state.value)
                }
                await invoke.writeFile(this.state.activeFile, content)
                Message.info('保存成功')
            }
        }
    }

    render() {
        if (this.state.file_type == 'markdown') {
            if (this.state.mode === "view") {
                return <div style={{ padding: '0 30px' }}>
                    <MDViewer value={this.state.value} file={this.state.activeFile} />
                </div>
            }
            return <div style={{ height: this.state.viewHeight, overflow: 'scroll', position: 'relative' }} onKeyUp={this.handleKeyUp} tabIndex="-1">
                <MDEditor value={this.state.value} file={this.state.activeFile} ref={(ele) => {
                    this.editor = ele
                }} onChangeText={this.changeText} />
            </div>
        }
        if (this.state.file_type == 'json') {
            if (this.state.mode === "view") {
                return <div style={{ overflow: 'scroll' }}>
                    <JSONView json={this.state.value} />
                </div>
            }
            return <div class="app" onKeyUp={this.handleKeyUp} tabIndex="-1">
                <JSONEditor height={this.state.viewHeight} ref={(ele) => {
                    this.editor = ele
                }} json={this.state.value} onChangeText={this.changeJSON} />
            </div>
        }
        return <MonacoEditor
            width={'100%'}
            height={this.state.viewHeight}
            language={this.state.file_type}
            theme="vs-dark"
            value={this.state.value}
            options={{
                selectOnLineNumbers: true
            }}
            onChange={console.log}
        />
    }
}

export default App
