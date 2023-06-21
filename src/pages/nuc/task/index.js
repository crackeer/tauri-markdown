import React from 'react';
import { Button, Input, Grid, Space, Table, Tag, Pagination, Modal, Card } from '@arco-design/web-react';
import api from '@/util/api';
import common from '@/util/common';
import { open } from '@tauri-apps/api/shell';
import lodash from 'lodash'
const Row = Grid.Row;
const Col = Grid.Col;

const PageSize = 50
const TaskStatusMapping = {
    '': '未开始',
    'running': '运行中',
    'pending': '运行中 ',
    'success': '成功',
    'failure': '失败',
}
const COLORS = {
    '': '#7816ff',
    'running': '#00b42a',
    'pending': '#165dff',
    'success': 'green',
    'failure': '#eb0aa4',
    'queue': '#7bc616',
};

const TaskTypeMapping = {
    'vr_task': 'VR任务',
    'project_export_tf': 'Project->TF卡',
    'project_export_cos': 'Project->COS',
    'work_export_tf': 'VRFile->TF卡',
    'work_export_cos': 'VRFile->COS',
    'auto_clear_project': 'Project删除'
}

const parseInputObject = (input) => {
    try {
        let object = JSON.parse(input)
        if (object['work_id'] != undefined) {
            return {
                value: object['work_id'],
                type: 'work'
            }
        }

        if (object['project_id'] != undefined) {
            return {
                value: object['project_id'],
                type: 'project'
            }
        }
    } catch (e) {
        return {
            value: '',
            type: 'unknown'
        }
    }
}

class App extends React.Component {
    columns = [
        {
            'title': '序号',
            'dataIndex': 'index',
            'key': 'index',
        },
        {
            'title': '任务名称',
            'dataIndex': 'task_name',
            'key': 'task_name',
        },
        {
            'title': '对象',
            'dataIndex': 'object_value',
            'key': 'object_value',
        },
        {
            'title': '对象名字',
            'dataIndex': 'object_text',
            'key': 'object_text',
        },
        {
            'title': '开始时间',
            'dataIndex': 'create_time',
            'key': 'create_time',
        },
        {
            'title': '结束时间',
            'dataIndex': 'modify_time',
            'key': 'modify_time',
        },
        {
            'title': '状态',
            'dataIndex': 'state',
            'key': 'state',
            'render': (col, record, index) => (
                <Tag color={COLORS[record.state]}>{TaskStatusMapping[record.state]}</Tag>
            )
        },
        {
            'title': '耗时(s)',
            'dataIndex': 'cost',
            'key': 'cost',
        },
        {
            'title': '操作',
            'key': 'opt',
            'render': (col, record, index) => (
                <Space>
                    <Button onClick={this.getDetail.bind(this, record)} size="small" type="text">详情</Button>
                </Space>
            )
        }
    ]
    constructor(props) {
        super(props);
        this.state = {
            task_type: '',
            list: [],
            loading: false,
            current_page: 1,
            total_page: 0,
            workList: {},
            currentSubTask : null,
            processList : [],
            visible : false,
        }
    }
    async componentDidMount() {
        this.getTaskList()
        //this.refreshData()
    }
    refreshData = async () => {
        await this.getTaskList()
        setTimeout(() => {
            this.refreshData()
        }, 2000)
    }
    changePage = async (value) => {
        await this.setState({
            current_page: value
        })
        this.getTaskList()
    }
    getTaskList = async () => {
        await this.setState({
            loading: true,
            list: [],
        })
        let data = await api.queryShepherd({
            table: 'sub_task',
            order_by: 'id desc',
            page: this.state.current_page,
            page_size: PageSize,
        })
        data.list = await this.formatSubTaskList(data.list)

        await this.setState(data)
    }
    queryWorks = async (workIDs) => {
        let data = await api.queryVrapi({
            table: 'work',
            query: {
                'id': workIDs
            },
            page: 1,
            page_size: 1000,
        })
        let retData = {}
        for (var i in data.list) {
            retData[data.list[i].id] = data.list[i]
        }
        return retData
    }
    queryProjects = async (projectIDs) => {
        let data = await api.queryVrapi({
            table: 'project',
            query: {
                'project_id': projectIDs
            },
            page: 1,
            page_size: 1000,
        })
        let retData = {}
        for (var i in data.list) {
            retData[data.list[i].project_id] = data.list[i]
        }
        return retData
    }

    formatSubTaskList = async (list) => {
        let workIDs = []
        let projectIDs = []
        for (var i in list) {
            list[i]['index'] = (this.state.current_page - 1) * PageSize + parseInt(i) + 1
            let object = parseInputObject(list[i].input)
            list[i].object_value = object.value
            list[i].object_type = object.type
            if (object.type == 'work') {
                workIDs.push(object.value)
            }
            if (object.type == 'project') {
                projectIDs.push(object.value)
            }

            if (TaskTypeMapping[list[i].type] != undefined) {
                list[i].task_name = TaskTypeMapping[list[i].type]
            } else {
                list[i].task_name = list[i].type
            }
            list[i].create_time = common.convertDBTime(list[i].create_time)
            list[i].modify_time = common.convertDBTime(list[i].modify_time)
            list[i].cost = common.convertDBTime2Unix(list[i].modify_time) - common.convertDBTime2Unix(list[i].create_time)
        }
        let works = await this.queryWorks(workIDs)
        let projects = await this.queryProjects(projectIDs)
        for (var i in list) {
            if (list[i].object_type == 'project' && projects[list[i].object_value] != undefined) {
                list[i]['object_text'] = projects[list[i].object_value].name
            }
            if (list[i].object_type == 'work' && works[list[i].object_value] != undefined) {
                list[i]['object_text'] = works[list[i].object_value].name
            }
        }
        return list
    }
    getDetail = async (record) => {
        let data = await api.queryShepherd({
            table: 'task_process',
            order_by: 'id asc',
            query : {
                sub_task_id : record.id,
            },
            page: 1,
            page_size: PageSize,
        })
        console.log(data.list)
        await this.setState({
            currentSubTask : lodash.clone(record),
            processList : data.list,
            visible : true
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            任务<Button onClick={this.getTaskList}>刷新</Button>
        </Space></h3>
    }

    render() {
        return <>
            <Table data={this.state.list} columns={this.columns} pagination={false} rowKey={'id'} />
            <div style={{ textAlign: 'center', margin: '10px auto' }}>
                <Pagination size={'large'} total={this.state.total} showTotal hideOnSinglePage current={this.state.current_page} pageSize={PageSize} onChange={this.changePage} />
            </div>
            <Modal visible={this.state.visible} style={{width:'70%'}} onCancel={() => this.setState({visible:false})}>
                <p>任务输入:</p>
                {
                    this.state.currentSubTask != null ?  <Input.TextArea value={this.state.currentSubTask.input + ''} /> : null
                }
               
                {this.state.processList.map(item => {
                    return <Card title={'算子：' + item.process + "【状态：" +item.state + '】'} style={{marginTop:'15px'}}>
                        <p>Input</p>
                        <Input.TextArea value={item.input} rows={5}/>
                        <p>Output</p>
                        <Input.TextArea value={item.output} rows={5}/>
                        <p>Callback</p>
                        <Input.TextArea value={item.callback} rows={5}/>
                    </Card>
                })}
            </Modal>
        </>
    }
}


const ProcessInfo = (props) => {
    if (props.data == undefined) {
        return <>
            暂无
        </>
    }
    return <>
        {props.list.map(item => {
            return <Row gutter={20}>
                <Col span={24}>
                    <Space>
                        <span>算子：{item.process}</span>
                        <span>状态：{item.state}</span>
                        <span>CreateAt：{item.create_time}</span>
                        <span>ModifyAt：{item.modify_time}</span>
                    </Space>
                </Col>
                <Col span={8}>
                    <p>Input</p>
                    <Input.TextArea value={item.input} rows={1} />
                </Col>
                <Col span={8}>
                    <p>Input</p>
                    <Input.TextArea value={item.output} rows={1} />
                </Col>
                <Col span={8}>
                    <p>Input</p>
                    <Input.TextArea value={item.callback} rows={1} />
                </Col>
            </Row>
        })}

    </>

}

export default App
