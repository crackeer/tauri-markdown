import React from 'react';
import '@/styles/globals.css'
import "@arco-design/web-react/dist/css/arco.css";
import { Layout, Menu, Divider } from '@arco-design/web-react';
import { IconHome, IconCalendar,IconCommon } from '@arco-design/web-react/icon';
import cache from '@/util/cache';
const Sider = Layout.Sider;
const MenuItem = Menu.Item;

const menuKeyMapping = {
    'markdown': '/markdown/detail',
    'main': '/inspire/ok'
}

function getLocationByMenuKey(key) {
    if (menuKeyMapping[key] === undefined) {
        return null
    }
    return menuKeyMapping[key]
}

function getMarginLeft(value) {
    if (value) {
        return "48px"
    }
    return "200px"
}
class ClassApp extends React.Component {
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
        if (ref != null && ref.htmlTitle != undefined) {
            this.setState({
                headTitle: ref.htmlTitle(),
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
                        <a href="/">
                            <MenuItem key='main'>
                                <IconHome/>主页
                            </MenuItem>
                        </a>
                        <a href="/markdown/">
                            <MenuItem key='markdown'>
                            <IconCommon />Markdown
                            </MenuItem>
                        </a>
                    </Menu>
                </Sider>
                <Layout style={{ marginLeft: this.state.marginLeft, padding:'10px' }}>
                    {this.state.headTitle}
                    <Divider style={{ margin: '0 0 20px' }}></Divider>
                    <Component {...pageProps} ref={this.refUpdate} />
                </Layout>
            </Layout>

        </>
    }
}
export default ClassApp