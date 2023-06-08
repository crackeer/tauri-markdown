import React from 'react';
import { Button, Layout, Affix, List } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import cache from '@/util/cache';
import { IconEdit, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';

class App extends React.Component {
    directory = null;
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
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
        for(var i in this.state.files) {
            selected.push(this.state.files[i])
        }
       
        await this.setState({
            files: selected
        })
        cache.setMarkdownFiles(selected)
    }

    render() {
        return (
            <>
                <div>
                    <Button onClick={this.openDirectory} type="primary">打开markdown</Button>
                </div>
                <List dataSource={this.state.files} render={render.bind(null, [
                    <span className='list-demo-actions-icon'>
                        <IconEdit />
                    </span>,
                    <span className='list-demo-actions-icon'>
                        <IconDelete />
                    </span>
                ])} />
            </>
        )
    }
}

const render = (actions, item, index) => (
    <List.Item key={index} actions={actions}>
        <List.Item.Meta
            title={item}
        />
    </List.Item>
);
export default App
