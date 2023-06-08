import React from 'react';
import { Button, Modal, Affix, List } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import Markdown from '@/component/Markdown';
import utilFs from '../../util/fs'
import cache from '@/util/cache';
import { IconEdit, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';
import { Card, Avatar, Link, Typography, Space, Row } from '@arco-design/web-react';

const ModalHeaderWidth = 48
const ModalFooterHeight = 65
function getModalHeight() {
    let height = document.documentElement.clientHeight
    let modalHeight = height - 40
    let modalContent = modalHeight - ModalHeaderWidth - ModalFooterHeight - 40
    return {
        modalHeight: modalHeight,
        modalContentHeight: modalContent
    }
}
class App extends React.Component {
    markdown = null;
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
            visible: false,
            activeFile: '',
            mode: 'view',
            files: [],
            modalHeight: 0,
            modalContentHeight: 0,
            switchText:'编辑'
        }
        this.directory = React.createRef()
        this.markdown = React.createRef()
    }
    async componentDidMount() {
        let list = await cache.getMarkdownFiles()
        console.log(list)
        this.setState({
            files: list
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            Markdown
            <Button onClick={this.openDirectory} type="primary">打开markdown</Button>
        </Space></h3>
    }
    openDirectory = async () => {
        let selected = await open({
            directory: false,
            multiple: true,
            filters: [{
                name: 'Markdown',
                extensions: ['md']
            }],
        });
        for (var i in this.state.files) {
            selected.push(this.state.files[i])
        }

        await this.setState({
            files: selected
        })
        cache.setMarkdownFiles(selected)
    }
    toView = async (item, index) => {
        this.setState({
            activeFile: item,
            mode: 'view',
            visible: true,
            switchText : '编辑',
            ...getModalHeight(),
        })
    }
    switchEdit = async () => {
        this.markdown.switchMode('edit')
        this.setState({
            switchText : this.state.switchText == '编辑' ? '查看' : '编辑'
        })
    }
    toDelete = async (item, index) => {
        let data = this.state.files.filter(temp => {
            return temp != item
        })
        this.setState({
            files: data
        })
    }

    render() {
        return (
            <div class="app">
                <List dataSource={this.state.files} render={render.bind(null, this.toView, this.toDelete)} />

                <Modal
                    title={
                        <div style={{ textAlign: 'left' }}>
                            {this.state.activeFile}
                        </div>}
                    visible={this.state.visible}
                    alignCenter={false}
                    escToExit={false}
                    unmountOnExit={true}
                    style={{ width: '75%', top: '20px', height: this.state.modalHeight + 'px', overflow: 'scroll' }}
                    footer={
                        <div style={{ textAlign: 'center' }}>
                            <Space size={'large'}>
                                <Button onClick={this.switchEdit} type='primary'>{this.state.switchText}</Button>
                                <Button onClick={() => {this.setState({visible: false}) }} >关闭 </Button>
                            </Space>

                        </div>
                    }
                    onCancel={() => {
                        this.setState({
                            visible: false,
                        })
                    }}
                >
                    <div style={{ height: this.state.modalContentHeight + 'px', overflow: 'scroll' }}>
                        <Markdown file={this.state.activeFile} mode={this.state.mode} ref={(ele) => {
                            this.markdown = ele
                        }} />
                    </div>
                </Modal>
            </div>
        )
    }
}

const render = (viewFn, deleteFn, item, index) => (
    <List.Item key={index} actions={[
        <span className='list-demo-actions-icon' onClick={deleteFn.bind(null, item, index)}>
            <IconDelete />
        </span>
    ]}>
        <List.Item.Meta
            title={<Link href="#" onClick={viewFn.bind(null, item, index)}>{item}</Link>}
        />
    </List.Item>
);
export default App
