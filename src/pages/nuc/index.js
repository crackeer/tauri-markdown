import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Card, List, Link, Space, Divider } from '@arco-design/web-react';
import JSONView from '@/component/JSONView';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import MDViewer from '@/component/MDViewer';
import MDEditor from '@/component/MDEditor';
import dynamic from "next/dynamic";

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
    }
    htmlTitle = () => {
        return <h3><Space>
            Nuc状态查看
            <Button onClick={this.exportAllData} type='primary'>导出JSON</Button>
        </Space></h3>
    }

    render() {

        return <>
            <Card title={<strong>TF卡</strong>} style={{ marginTop: '10px' }}>
                <Divider>TF卡列表</Divider>
                <Divider>TF卡导入记录</Divider>
                <Divider>TF卡项目</Divider>
            </Card>
            <Card title={<strong>项目</strong>} style={{ marginTop: '10px' }}>
                <Divider>项目列表</Divider>
            </Card>
            <Card title={<strong>任务</strong>} style={{ marginTop: '10px' }}>
                <Divider>VR任务</Divider>
                <Divider>项目回传TF</Divider>
                <Divider>项目上传cos</Divider>
                <Divider>Work回传TF</Divider>
            </Card>
        </>
    }
}

export default App
