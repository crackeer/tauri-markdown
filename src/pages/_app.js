import React from 'react';
import '@/styles/globals.css'
import "@arco-design/web-react/dist/css/arco.css";
import { Layout, Menu, Affix } from '@arco-design/web-react';
import { IconHome, IconCodeSquare, IconScan, IconSelectAll, IconSend } from '@arco-design/web-react/icon';
import cache from '@/util/cache';
const Sider = Layout.Sider;
const MenuItem = Menu.Item;

const MenuList = [
    {'key' : 'main', 'icon' : <IconHome /> , 'href': '/', 'title': '主页'},
    {'key' : 'file', 'icon' : <IconCodeSquare /> , 'href': '/file', 'title': '文件'},
    {'key' : 'nuc_tf', 'icon' : <IconScan />, 'href': '/nuc/tf', 'title': 'TF卡'},
    {'key' : 'nuc_project', 'icon' : <IconSelectAll />, 'href': '/nuc/project', 'title': '项目'},
    {'key' : 'nuc_task', 'icon' : <IconSend />, 'href': '/nuc/task', 'title': '任务'},
]

function getMarginLeft(value) {
    if (value) {
        return "48px"
    }
    return "200px"
}
class ClassApp extends React.Component {
    ref = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            headTitle: null,
            collapsed: null,
            marginLeft: '',
        }
    }
    componentDidMount = async () => {
        let collapsed = await cache.getMenuCollapsed() > 0
        await this.setState({
            collapsed: collapsed,
            marginLeft: getMarginLeft(collapsed)
        });
    }
    refUpdate = async (ref) => {
        this.ref = ref;
        if (ref != null && ref.htmlTitle != undefined) {
            this.setState({
                headTitle: ref.htmlTitle(),
            })
        }
    }
    updateTitle = () => {
        if (this.ref != null && this.ref.htmlTitle != undefined) {
            this.setState({
                headTitle: this.ref.htmlTitle(),
            })
        }
    }
    setCollapse = async (value) => {
        await this.setState({
            collapsed: value,
            marginLeft: getMarginLeft(value),
        })
        cache.setMenuCollapsed(value ? 1 : 0)
    }
    clickMenuItem = async (key) => {
        window.location.href = "/" + key
        for(var i in MenuList) {
            if(MenuList[i].key === key) {
                window.location.href = MenuList[i].href
                return
            }
        }
    }
    render() {
        const { Component, pageProps } = this.props
        if (this.state.collapsed == null) {
            return null
        }
        return <>
            <Layout>
                <Sider
                    theme='dark'
                    onCollapse={this.setCollapse}
                    collapsed={this.state.collapsed}
                    collapsible
                    style={{
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                    }}
                >
                    <Menu onClickMenuItem={this.clickMenuItem} theme='dark'>
                        {
                            MenuList.map(item => {
                                return <MenuItem key={item.key}>{item.icon}{item.title}</MenuItem>
                            })
                        }
                    </Menu>
                </Sider>
                <Layout style={{ marginLeft: this.state.marginLeft, padding: '10px' }}>
                    <Affix offsetTop={0} affixStyle={{ background: 'white' }}>
                        {this.state.headTitle}
                    </Affix>
                    <Component {...pageProps} ref={this.refUpdate} updateTitle={this.updateTitle} />
                </Layout>
            </Layout>

        </>
    }
}
export default ClassApp