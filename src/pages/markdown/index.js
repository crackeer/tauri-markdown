import React from 'react';
import { Button, Modal, Affix, List } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import Markdown from '@/component/Markdown';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import { IconEdit, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';
import { Card, Avatar, Link, Typography, Space, Row } from '@arco-design/web-react';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            files: [],
        }
        this.directory = React.createRef()
        this.markdown = React.createRef()
    }
    async componentDidMount() {
        let list = await cache.getMarkdownFiles()

        this.setState({
            files: list
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            文件
            <Button onClick={this.openDirectory} type="primary">添加文件</Button>
            <Button type='link' href={'/file/create?file_type=json'}>新建JSON</Button>
            <Button type='link' href={'/file/create?file_type=markdown'}>新建Markdown</Button>
        </Space></h3>
    }
    openDirectory = async () => {
        let selected = await open({
            directory: false,
            multiple: true,
            filters: [{
                name: 'File',
                extensions: ['md', 'json']
            }],
        });
        if (selected == null || selected.length < 1) {
            return
        }
        for(var i in selected) {
            let result = await invoke.fileExists(selected[i])
            if(!result) {
                await invoke.createFile(selected[i])
            }
        }
       
        for (var i in this.state.files) {
            if(selected.indexOf(this.state.files[i]) < 0) {
                selected.push(this.state.files[i])
            }
        }

        await this.setState({
            files: selected
        })
        cache.setMarkdownFiles(selected)
    }

    toDelete = async (item, index) => {
        let data = this.state.files.filter((temp, i) => {
            return i != index
        })
        this.setState({
            files: data
        })
        cache.setMarkdownFiles(data)
    }

    render() {
        return (
            <div class="app">
                <List dataSource={this.state.files} render={render.bind(null, this.toDelete)} />
            </div>
        )
    }
}

const render = ( deleteFn, item, index) => (
    <List.Item key={index} actions={[
        <span className='list-demo-actions-icon' onClick={deleteFn.bind(null, item, index)}>
            <IconDelete />
        </span>
    ]}>
        <List.Item.Meta
            title={<Link href={'/file?file=' + item} >{item}</Link>}
        />
    </List.Item>
);
export default App
