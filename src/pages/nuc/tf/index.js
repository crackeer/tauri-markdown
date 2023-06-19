import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Message, Grid, Space, Card } from '@arco-design/web-react';
import JSONView from '@/component/JSONView';
import cache from '@/util/cache';
import api from '@/util/api';
import invoke from '@/util/invoke'
import common from '@/util/common'
import MDViewer from '@/component/MDViewer';
import MDEditor from '@/component/MDEditor';
import dynamic from "next/dynamic";
import { getTTFB } from 'web-vitals';
const Row = Grid.Row;
const Col = Grid.Col;
class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            tfState : {
                State : '',
                UUID : ''
            },
            projectList : []
        }
    }
    async componentDidMount() {
        this.getTFData()
    }
    exportAllData = async () => {

    }
    getTFData = async () => {
        let data = await api.getTFState()
        if(data.code != 0) {
            Message.error(data.status)
            return
        }
        let projectList = await api.getTFProjects()
        this.setState({
            tfState : data.data.Result,
            projectList : projectList
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            TF卡
            <Button onClick={this.exportAllData} type='primary'>导出JSON</Button>
        </Space></h3>
    }

    render() {
        return <>
           <Card>
               <p>状态：{this.state.tfState.State}</p>
               <p>UUID：{this.state.tfState.UUID}</p>               
           </Card>
           <Row style={{marginTop:'10px'}}>
               {
                 this.state.projectList.map(item => {
                    return <Col span={8}><Card title={item.project_id}>
                        <p>名字：{item.title}</p>
                        <p>描述：{item.description}</p>
                        <p>DBVersion：{item.db_version}</p>
                        <p>创建时间：{item.create_time}</p>
                        <p>点位数：{item.observer_count}</p>
                        <p>Sensor：{item.sensor_width}*{item.sensor_height}</p>
                    </Card></Col>
                 })
               }
           </Row>
        </>
    }
}

export default App
