import React from 'react';
import { Button, Modal, Affix, List } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import { listen } from '@tauri-apps/api/event'
import Markdown from '@/component/Markdown';
import { setWindowTitle } from '../../util/invoke'
import utilFs from '../../util/fs'
import cache from '@/util/cache';
import { IconEdit, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';

class App extends React.Component {
    directory = null;
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
            visible: false,
            activeFile: '',
            mode: 'view',
            files: []
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
        return <h3>Markdown</h3>
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
    toEdit = async (item, index) => {
        this.setState({
            activeFile: item,
            mode: 'edit',
            visible: true
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
                <div>
                    <Button onClick={this.openDirectory} type="primary">打开markdown</Button>
                </div>
                <List dataSource={this.state.files} render={render.bind(null, this.toEdit, this.toDelete)} />

                <Modal
                    title={
                        <div style={{ textAlign: 'left' }}>
                            {this.state.activeFile}
                        </div>}
                    visible={this.state.visible}
                    alignCenter={false}
                    escToExit={false}
                    style={{ width: '80%', top: '20px', height: '90%' }}
                    footer={
                        <>
                            <Button
                                onClick={() => {
                                }}
                            >
                                Return
                            </Button>
                            <Button
                                onClick={() => {

                                }}
                                type='primary'
                            >
                                Submit
                            </Button>
                        </>
                    }
                    onCancel={() => {
                        this.setState({
                            visible: false,
                        })
                    }}
                >
                    <Markdown file={this.state.activeFile} mode={this.state.mode}/>
                </Modal>
            </div>
        )
    }
}

const render = (editFn, deleteFn, item, index) => (
    <List.Item key={index} actions={[
        <span className='list-demo-actions-icon' onClick={editFn.bind(null, item, index)}>
            <IconEdit />
        </span>,
        <span className='list-demo-actions-icon' onClick={deleteFn.bind(null, item, index)}>
            <IconDelete />
        </span>
    ]}>
        <List.Item.Meta
            title={item}
        />
    </List.Item>
);
export default App
