import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Modal, List, Link, Space, Message } from '@arco-design/web-react';
import { save } from '@tauri-apps/api/dialog';
import JSONEditor from '@/component/JSONEditor';
import lodash from 'lodash'
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import MDEditor from '@/component/MDEditor';

class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            activeFile: '',
            value: null,
            viewHeight: 0,
        }
    }
    async componentDidMount() {
        let fileType = common.getQuery("file_type", "text");
        await this.initFileType(fileType);
    }
    htmlTitle = () => {
        if(this.state.file_type == common.FileTypeJSON) {
            return <h3><Space>新建JSON</Space></h3>
        }
        if(this.state.file_type == common.FileTypeMarkdown) {
            return <h3><Space>新建Markdown</Space></h3>
        }
        return 
    }
    initFileType = async (fileType) => {
        if (fileType === common.FileTypeJSON) {
            await this.setState({
                file_type: fileType,
                viewHeight: common.getViewHeight(),
                value: {}
            })
        } else if (fileType === common.FileTypeMarkdown) {
            await this.setState({
                file_type: fileType,
                viewHeight: common.getViewHeight(),
                value: ''
            })
        }
        this.props.updateTitle()
    }
    changeJSON = async (value) => {
        try {
            let json = JSON.parse(value)
            await this.setState({ value: json })
        } catch (e) {

        }
    }
    changeText = async (value) => {
        await this.setState({ value: value })
    }
    handleKeyUp = async (event) => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            console.log(this.state.file_type, common.getFileExtByType(this.state.file_type))
            let filePath = await save({
                filters: [{
                    name: this.state.file_type,
                    extensions: [common.getFileExtByType(this.state.file_type)]
                }]
            });
            if(filePath == null || filePath.length === 0) {
                return
            }
            let content = this.state.value
            if (this.state.file_type == common.FileTypeJSON) {
                content = JSON.stringify(this.state.value)
            }
            await invoke.writeFile(filePath, content)
            Message.info('保存成功')
            window.location.href = "/file?file=" + filePath
        }
    }

    render() {
        if (this.state.file_type == 'md') {
            return <div style={{ height: this.state.viewHeight, overflow: 'scroll', position: 'relative' }} onKeyUp={this.handleKeyUp} tabIndex="-1">
                <MDEditor value={this.state.value} file={''} ref={(ele) => {
                    this.editor = ele
                }} onChangeText={this.changeText} />
            </div>
        }
        if (this.state.file_type == 'json') {
            return <div class="app" onKeyUp={this.handleKeyUp} tabIndex="-1">
                <JSONEditor height={this.state.viewHeight} ref={(ele) => {
                    this.editor = ele
                }} json={this.state.value} onChangeText={this.changeJSON} />
            </div>
        }
    }
}

export default App
