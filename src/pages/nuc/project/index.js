import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Input, Grid, Space, Card, Tag, Pagination } from '@arco-design/web-react';
import api from '@/util/api';
import common from '@/util/common';
import { open } from '@tauri-apps/api/shell';
const Row = Grid.Row;
const Col = Grid.Col;

const PageSize = 10
const ProjectStatusMapping = {
    '0': '未处理',
    '1': '生成中',
    '2': '生成失败 ',
    '3': '上传中',
    '4': '生成成功',
    '5': '生成成功',
    '6': '被屏蔽',
    '7': '排队中',
}
const COLORS = [
    '#7816ff',
    '#00b42a',
    '#165dff',
    '#ff7d00',
    '#eb0aa4',
    '#7bc616',
    '#86909c',
    '#b71de8',
    '#0fc6c2',
    '#ffb400',
    '#168cff',
    '#ff5722',
];
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            list: [],
            loading: false,
            current_page: 1,
            total_page: 0,
            workList: {},
        }
    }
    async componentDidMount() {
        this.getProjectList()
        //this.refreshData()
    }
    refreshData = async () => {
        await this.getProjectList()
        setTimeout(() => {
            this.refreshData()
        }, 2000)
    }
    changePage = async (value) => {
        await this.setState({
            current_page : value
        })
        this.getProjectList()
    }
    getProjectList = async () => {
        await this.setState({
            loading: true,
            list: [],
        })
        let data = await api.queryVrapi({
            table: 'project',
            order_by: 'id desc',
            page: this.state.current_page,
            page_size: PageSize,
        })
        let workIDs = []
        for (var i in data.list) {
            if (data.list[i].work_id > 0) {
                workIDs.push(data.list[i].work_id)
            }
        }
        let result = await api.queryVrapi({
            table: 'work_addition',
            query: {
                'work_id': workIDs,
            },
            page: 1,
            page_size: PageSize,
        })
        console.log(result)
        let workData = {}
        for (var j in result.list) {
            let tmp = {}
            try {
                tmp = JSON.parse(result.list[j].extension)
            } catch {

            }
            let workCode = await api.decodeWorkCode({ work_id: result.list[j].work_id })
            tmp['cube_size'] = result.list[j].cube_size
            tmp['work_code'] = workCode.work_code
            tmp['observer_count'] = result.list[j].observer_num
            workData[result.list[j].work_id] = tmp
        }
        await this.setState(data)
        await this.setState({
            workList: workData
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            项目 <Button onClick={this.getProjectList}>刷新</Button>
        </Space></h3>
    }

    render() {
        return <>
            <Row gutter={10}>
                {
                    this.state.list.map((item, index) => {
                        return <Col span={24} style={{ marginBottom: '30px' }}><Card title={
                            <Space size={'large'}>
                                <span>第{(this.state.current_page -1) * PageSize + index + 1}条：{item.name}</span>
                                <span><ProjectStatus status={item.status} is_deleted={item.is_deleted} /></span>
                            </Space>
                        } key={item.id} hoverable={true}>
                            <Row gutter={30}>
                                <Col span={12}>
                                    <h3>Project信息</h3>
                                    <p>ID：{item.id}</p>
                                    <p>ProjectID：{item.project_id}</p>
                                    <p>WorkID：{item.work_id}</p>
                                    <p>OfflineID：{item.offline_id}</p>
                                    <p>Status：{item.status}</p>
                                    <p>IsDeleted：{item.is_deleted}</p>
                                    <p>创建时间：{item.create_time}</p>
                                    <p>修改时间：{item.modify_time}</p>
                                    <p>Project扩展</p>
                                    <Input.TextArea value={item.extension} rows={5} />
                                </Col>
                                <Col span={12}>
                                    {
                                        this.state.workList[item.work_id] != undefined ? <WorkInfo data={this.state.workList[item.work_id]} /> : null
                                    }
                                </Col>
                            </Row>
                        </Card>
                        </Col>
                    })
                }
            </Row>
            <div style={{ textAlign: 'center', margin:'10px auto' }}>
                <Pagination size={'large'} total={this.state.total} showTotal hideOnSinglePage current={this.state.current_page} pageSize={PageSize} onChange={this.changePage} />
            </div>

        </>
    }
}

const ProjectStatus = (props) => {
    if (props.is_deleted) {
        return <Tag color={'red'}>已删除</Tag>
    }
    if (ProjectStatusMapping[props.status] != undefined) {
        return <Tag color={COLORS[props.status]}>{ProjectStatusMapping[props.status]}</Tag>
    }
    return <Tag>未知</Tag>
}

const WorkInfo = (props) => {
    if (props.data == undefined) {
        return <>
            暂无
        </>
    }
    const preview = async () => {
        let result = await api.getAccessToken()
        let url = 'http://10.11.1.3/html/vr.html?' + common.httpBuildQuery({
            vrCode: '80' + props.data.work_code,
            accessToken: result.access_token
        })
        await open(url)
    }
    return <>
        <h3>VR信息 {
            props.data.cube_size > 0 ? <Button onClick={preview} size='small' type='primary'>预览</Button> : null
        }</h3>
        <p>WorkCode：{props.data.work_code}</p>
        <p>CubeSize：{props.data.cube_size}</p>
        <p>点位数量：{props.data.observer_count}</p>
        <p>VR任务ID：{props.data.task_id}</p>
        <p>SrcModel下载</p>
        <Input.TextArea value={props.data.src_model} rows={1} />
        <p>SrcPano下载</p>
        <Input.TextArea value={props.data.src_pano} rows={1} />
        <p>全局算法参数</p>
        <Input.TextArea value={JSON.stringify(props.data.vr_task.global_alg_params)} rows={3} />
    </>
}

export default App
