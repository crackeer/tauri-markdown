import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Message, Grid, Space, Card, Table, Divider } from '@arco-design/web-react';
import api from '@/util/api';
const Row = Grid.Row;
const Col = Grid.Col;
class App extends React.Component {
    columns = [
        {
            'title': '项目ID',
            'dataIndex': 'project_id',
            'key': 'project_id',
        },
        {
            'title': '标题',
            'dataIndex': 'title',
            'key': 'title',
        },
        {
            'title': 'db_version',
            'dataIndex': 'db_version',
            'key': 'db_version',
        },
        {
            'title': '点位数',
            'dataIndex': 'observer_count',
            'key': 'observer_count',
        },
        {
            'title': 'Sensor',
            'key': 'sensor',
            'dataIndex': '',
            'render': (col, record, index) => (
                <>{record.sensor_width}*{record.sensor_height}</>
            )
        },
        {
            'title': '创建时间',
            'dataIndex': 'create_time',
            'key': 'create_time',
        },

    ];
    constructor(props) {
        super(props);
        this.state = {
            tfState: {
                State: '',
                UUID: ''
            },
            projectList: [],
            importLog: [],
            vrfileList : [],
            loading: false,
        }
    }
    async componentDidMount() {
        //this.getTFData()
        this.refreshData()
    }
    exportAllData = async () => {
    }
    refreshData = async () => {
        await this.getTFData()
        setTimeout(() => {
            this.refreshData()
        }, 2000)
    }
    getTFData = async () => {
        await this.setState({
            loading: true,
        })
        let data = await api.getTFState()
        if (data.code != 0) {
            Message.error(data.status)
            return
        }
        let projectList = await api.getTFProjects()
        let importLog = await api.getTFImportLog()
        let vrfileList = await api.getTFVRFileList()
        console.log(vrfileList)
        this.setState({
            tfState: data.data.Result,
            projectList: projectList,
            importLog: importLog,
            vrfileList : vrfileList,
            loading: false
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
            <Card title={<Space>状态{this.state.loading ? <small>数据更新中</small> : null}</Space>}>
                <p>状态：{this.state.tfState.State}</p>
                <p>UUID：{this.state.tfState.UUID}</p>

            </Card>
            <div style={{ marginTop: '10px' }}>
                <h3>项目</h3>
                <Table data={this.state.projectList} columns={this.columns} border={true} pagination={false} />
            </div>

            <div style={{ marginTop: '10px' }}>
                <h3>项目导入记录</h3>
                <Card>
                    <Row style={{ height: '50%', overflow: 'scroll' }}>
                        {
                            this.state.importLog.map(item => {
                                return <Col span={24} style={{ marginBottom: '15px' }}>
                                    <Space size={'large'} style={{ fontWeight: 'bold' }}>
                                        <span>UUID: {item.uuid}</span>
                                        <span>开始: {item.start_time}</span>
                                        <span>结束: {item.end_time}</span>
                                        <span>耗时: {item.cost}</span>
                                        <span>数量: {item.project_count}</span>
                                    </Space>
                                    <Projects list={item.projects} />
                                </Col>
                            })
                        }
                    </Row>
                </Card>
            </div>

            <div style={{ marginTop: '10px' }}>
                <h3>VRFile列表</h3>
                <Card>
                        {this.state.vrfileList.map(item => {
                            return <p>{item}</p>
                        })}
                </Card>
            </div>
        </>
    }
}

const Projects = (props) => {
    const columns = [
        {
            'title': '项目ID',
            'dataIndex': 'project_id',
            'key': 'project_id',
        },
        {
            'title': '开始时间',
            'dataIndex': 'start_time',
            'key': 'start_time',
        },
        {
            'title': '结束时间',
            'dataIndex': 'end_time',
            'key': 'end_time',
        },
        {
            'title': '状态',
            'dataIndex': 'status',
            'key': 'status',
        },
        {
            'title': '耗时(s)',
            'dataIndex': 'cost',
            'key': 'cost',
        },
        {
            'title': '错误Code',
            'dataIndex': 'error_code',
            'key': 'error_code',
        }
    ]
    if (props.list.length < 1) {
        return null
    }
    return <>
        <Table data={props.list} columns={columns} pagination={false} expandedRowRender={(record) =>{
            return <p>
                错误消息：{record.error_message}
            </p>
        }} expandProps={{rowExpandable: (record) => record.status == 'failure'}} rowKey={'project_id'}/>
    </>
}

export default App
