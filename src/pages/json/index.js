import React from 'react';
import { Button, Modal, List, Link, Space, Message } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import JSONView from '@/component/JSONView';
import JSONEditor from '@/component/JSONEditor';

import cache from '@/util/cache';
import invoke from '@/util/invoke'
import { IconEdit, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';

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
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            activeFile: '',
            mode: 'view',
            files: [],
            json : null,
            modalHeight: 0,
            modalContentHeight: 0,
            switchText: '编辑'
        }
    }
    async componentDidMount() {
        let list = await cache.getJSONFiles()

        this.setState({
            files: list
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            Json
            <Button onClick={this.openDirectory} type="primary">打开Json</Button>
        </Space></h3>
    }
    openDirectory = async () => {
        let selected = await open({
            directory: false,
            multiple: true,
            filters: [{
                name: 'Json',
                extensions: ['json']
            }],
        });
        if (selected == null || selected.length < 1) {
            return
        }
        for (var i in selected) {
            let result = await invoke.fileExists(selected[i])
            if (!result) {
                await invoke.createFile(selected[i])
            }
        }

        for (var i in this.state.files) {
            if (selected.indexOf(this.state.files[i]) < 0) {
                selected.push(this.state.files[i])
            }
        }

        await this.setState({
            files: selected
        })
        cache.setJSONFiles(selected)
    }
    toView = async (item, index) => {
        let value = await invoke.readFile(item)
        try {
            let json = JSON.parse(value)
            await this.setState({
                activeFile: item,
                json: json,
                mode: 'view',
                visible: true,
                ...getModalHeight(),
            })
        } catch(e) {
            Message.error(e.message)
        }
        
    }
    switchEdit = async () => {
        await this.setState({
            mode: this.state.mode === 'view' ? 'edit' : 'view'
        })
    }
    changeJSON = async (value) => {
        try {
            let json = JSON.parse(value)
            await this.setState({json: json})
            console.log(json)
        } catch(e) {

        }
    }
    toDelete = async (item, index) => {
        let data = this.state.files.filter((temp, i) => {
            return i != index
        })
        this.setState({
            files: data
        })
        cache.setJSONFiles(data)
    }
    handleKeyUp = async (event) => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (this.state.mode === "edit") {
                let content = JSON.stringify(this.state.json)
                await invoke.writeFile(this.state.activeFile, content)
                Message.info('保存成功')
            }
        }
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
                                <Button onClick={this.switchEdit} type='primary'>{this.state.mode == 'view' ? '编辑' : '查看'}</Button>
                                <Button onClick={() => { this.setState({ visible: false }) }} >关闭 </Button>
                            </Space>

                        </div>
                    }
                    onCancel={() => {
                        this.setState({
                            visible: false,
                        })
                    }}
                    onKeyUp={this.handleKeyUp} tabIndex="-1"
                >
                    {
                        this.state.mode == 'view' ? <div style={{ height: this.state.modalContentHeight + 'px', overflow: 'scroll' }}>
                            <JSONView json={this.state.json} />
                        </div> : <JSONEditor height={this.state.modalContentHeight} ref={(ele) => {
                            this.editor = ele
                        }} json={this.state.json} onChangeText={this.changeJSON}/>
                    }

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
