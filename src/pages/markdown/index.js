import React from 'react';
import { Button, Table, Timeline, List } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import Markdown from '@/component/Markdown';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import { IconEdit, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';
import { Card, Avatar, Link, Typography, Space, Row } from '@arco-design/web-react';
import dayjs from 'dayjs';
const TimelineItem = Timeline.Item;
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
        let list = await cache.getOpenFiles()

        this.setState({
            files: list
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            文件
            <Button onClick={this.addFile} type="primary">添加</Button>
            <Button onClick={this.openFile} type="primary">打开</Button>
            <Button type='link' href={'/file/create?file_type=json'}>新建JSON</Button>
            <Button type='link' href={'/file/create?file_type=md'}>新建Markdown</Button>
        </Space></h3>
    }
    openFile = async () => {
        let selected = await open({
            directory: false,
            multiple: false,
            filters: [{
                name: 'File',
                extensions: ['md', 'json']
            }],
        });
        if (selected == null || selected.length < 1) {
            return
        }
        let result = await invoke.fileExists(selected)
        if (!result) {
            await invoke.createFile(selected)
        }
        window.location.href = "/file?file=" + selected
    }
    addFile = async () => {
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
        for (var i in selected) {
            let result = await invoke.fileExists(selected[i])
            if (!result) {
                await invoke.createFile(selected[i])
            }
        }

        let list = await cache.addOpenFiles(selected)

        await this.setState({
            files: list
        })
    }
    groupList = (list) => {
        let dateGroup = {}
        for (var i in list) {
            let fileType = common.detectFileType(list[i]['file'])
            list[i]['file_type'] = fileType.toUpperCase()
            if (fileType == common.FileTypeJSON) {
                list[i]['color'] = '#3370ff'
            } else if (fileType == common.FileTypeMarkdown) {
                list[i]['color'] = '#00d0b6'
            }
        }
        for (var i in list) {
            if (dateGroup[list[i].date] == undefined) {
                dateGroup[list[i].date] = []
            }
            dateGroup[list[i].date].push(list[i])
        }
        let retData = []
        Object.keys(dateGroup).forEach(key => {
            retData.push({
                "date": key,
                "files": dateGroup[key]
            })
        })
        retData = retData.sort((a, b) =>{
            if (a.date < b.date) {
                return 1
            }
            return -1
        })
        return retData
    }
    toDelete = async (item) => {
        let list = await cache.deleteOpenFiles([item.file])
        this.setState({
            files: list
        })
    }

    render() {
        let groupList = this.groupList(this.state.files)
        return (
            <div class="app" style={{margin:'10px auto', width:'88%'}}>
                {groupList.map(item => {
                    return <div style={{marginBottom:'10px'}}>
                        <Files data={item.files} deleteFn={this.toDelete} title={item.date}/>
                        </div>
                })}
            </div>
        )
    }
}

const Files = (props) => {
    return <List dataSource={props.data} size={'small'} render={(item, index) => {
        return <List.Item key={index} actions={[
            <span className='list-demo-actions-icon' onClick={() => {
                props.deleteFn(item);
            }}>
                <IconDelete />
            </span>
        ]} >
            <List.Item.Meta
                avatar={<Avatar shape='square' style={{ backgroundColor: item.color }}>{item.file_type}</Avatar>}
                title={<Link href={'/file?file=' + item.file}>{item.file}</Link>}
                description={item.time}
            />
        </List.Item>
    }} header={<strong>{props.title}</strong>}/>
}

export default App
