import React from 'react';
import '../styles/globals.css'
import "@arco-design/web-react/dist/css/arco.css";
import { Layout, Menu, Breadcrumb, Message, Divider } from '@arco-design/web-react';
import { IconHome, IconCalendar } from '@arco-design/web-react/icon';
const Sider = Layout.Sider;
const Header = Layout.Header;
const Footer = Layout.Footer;
const Content = Layout.Content;
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;
function BaseMenu(props) {
  return (
    <Menu defaultOpenKeys={['1']} defaultSelectedKeys={['0_2']} {...props}>
      <MenuItem key='0_1' disabled>
        <IconHome />
        Menu 1
      </MenuItem>
      <MenuItem key='0_2'>
        <IconCalendar />
        Menu 2
      </MenuItem>
      <SubMenu
        key='1'
        title={
          <span>
            <IconCalendar />
            Navigation 1
          </span>
        }
      >
        <MenuItem key='1_1'>Menu 1</MenuItem>
        <MenuItem key='1_2'>Menu 2</MenuItem>
        <SubMenu key='2' title='Navigation 2'>
          <MenuItem key='2_1'>Menu 1</MenuItem>
          <MenuItem key='2_2'>Menu 2</MenuItem>
        </SubMenu>
        <SubMenu key='3' title='Navigation 3'>
          <MenuItem key='3_1'>Menu 1</MenuItem>
          <MenuItem key='3_2'>Menu 2</MenuItem>
          <MenuItem key='3_3'>Menu 3</MenuItem>
        </SubMenu>
      </SubMenu>
      <SubMenu
        key='4'
        title={
          <span>
            <IconCalendar />
            Navigation 4
          </span>
        }
      >
        <MenuItem key='4_1'>Menu 1</MenuItem>
        <MenuItem key='4_2'>Menu 2</MenuItem>
        <MenuItem key='4_3'>Menu 3</MenuItem>
      </SubMenu>
    </Menu>
  );
}
function getMarginLeft(value) {
  if (value) {
    return "80px"
  }
  return "200px"
}
function getMenu() {
  return []
}
class ClassApp extends React.Component {
  component = null
  headerRef = null
  openKeys = []
  constructor(props) {
    super(props); // 用于父子组件传值
    this.state = {
      title: <></>,
      headTitle: '',
      collapsed: null,
      marginLeft: '',

      selectedKeys: [],
      env: '',
      allMenus: [],
      openKeys: [],
    }
  }
  componentDidMount = async () => {
    let collapsed = localStorage.getItem('collapsed') > 0
    let menus = getMenu()
    let openKeys = []
    menus.forEach(item => {
      openKeys.push(item.key)
    })
    this.openKeys = JSON.parse(JSON.stringify(openKeys))
    if (collapsed) {
      openKeys = []
    }
    await this.setState({
      selectedKeys: [window.location.pathname],
      allMenus: menus,
      openKeys: openKeys,
      collapsed: collapsed,
      marginLeft: getMarginLeft(collapsed)
    });
  }
  updateTitle = async () => {
    if (this.component != null && this.component.renderPageTitle != null && this.component.renderPageTitle != undefined) {
      await this.setState({
        title: this.component.renderPageTitle(),
      })
    }
  }
  refUpdate = async (ref) => {
    this.component = ref
    if (ref != null) {
      if (ref.htmlTitle != null && ref.htmlTitle != undefined) {
        this.setState({
          headTitle: ref.htmlTitle(),
        })
      }
      if (ref.renderPageTitle != null && ref.renderPageTitle != undefined) {
        await this.setState({
          title: ref.renderPageTitle(),
        })
      } else if (ref.htmlTitle != null && ref.htmlTitle != undefined) {
        await this.setState({
          title: <h3>
            <strong>{ref.htmlTitle()}</strong>
          </h3>
        })
      }
    }
  }
  setCollapse = async (value) => {
    await this.setState({
      collapsed: value,
      marginLeft: getMarginLeft(value),
      openKeys: value ? this.state.openKeys : this.openKeys,
    })
    localStorage.setItem('collapsed', value ? '1' : '0')
  }
  render() {
    const { Component, pageProps } = this.props
    if (this.state.collapsed == null) {
      return null
    }
    return <>
      <Layout className='layout-collapse-demo'>
        <Sider
          theme='dark'
          breakpoint='lg'
          onCollapse={this.setCollapse}
          collapsed={this.state.collapsed}
          width={220}
          collapsible
        >
          <div className='logo' />
          <BaseMenu
            onClickMenuItem={(key) =>
              Message.info({
                content: `You select ${key}`,
                showIcon: true,
              })
            }
            theme='dark'
            style={{ width: '100%' }}
          />
        </Sider>
        <Layout>
          <Layout style={{ padding: '0 24px' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>Home</Breadcrumb.Item>
              <Breadcrumb.Item>List</Breadcrumb.Item>
              <Breadcrumb.Item>App</Breadcrumb.Item>
            </Breadcrumb>
            <Content>
              <div ref={r => this.headerRef = r}>
                {this.state.title}
              </div>
              <Divider style={{ margin: '0 0 20px' }}></Divider>
              <Component {...pageProps} ref={this.refUpdate} updateTitle={this.updateTitle} />
            </Content>
            <Footer>Footer</Footer>
          </Layout>
        </Layout>
      </Layout>

    </>
  }
}


export default ClassApp