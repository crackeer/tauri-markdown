import React from 'react';
import { Button, Layout, Affix } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import { listen } from '@tauri-apps/api/event'
import Markdown from '@/component/Markdown';
import TreeDirectory from '@/component/TreeDirectory';
import { setWindowTitle } from '../util/invoke'
import utilFs from '../util/fs'

const Sider = Layout.Sider;
const Content = Layout.Content;

class App extends React.Component {
    directory = null;
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
            activeFile: '',
            mode: 'view',
        }
        this.directory = React.createRef()
        this.markdown = React.createRef()
    }
    async componentDidMount() {
        let object = await utilFs.getLoadConfig()
        this.initSelectFile(object)
        this.listen()
    }
    openDirectory = async () => {
        const {homeDir} = await import('@tauri-apps/api/path')
        const homeDirPath = await homeDir();
        let selected = await open({
            directory: true,
            multiple: false,
            defaultPath: homeDirPath,
        });
        if (selected == null || selected.length < 1) {
            return
        }
        await this.setState({
            rootDir: selected,
        })
        this.directory.current.initData(selected)
    }
    clickFileX = async (file) => {
        this.markdown.current.switchNewFile(file)
        await this.setState({
            activeFile: file,
        })
        setWindowTitle(file)

        utilFs.setLoadConfig({
            rootDir: this.state.rootDir,
            activeFile: file,
            mode: this.state.mode,
        })
    }
    handleKeyUp = async (event) => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.markdown.current.saveFile();
        }
        if (event.key === "Alt") {
            event.preventDefault();
            this.markdown.current.switchMode()
            this.setState({
                mode : this.state.mode == 'edit' ? 'view' : 'edit',
            })
            utilFs.setLoadConfig({
                rootDir: this.state.rootDir,
                activeFile: this.state.activeFile,
                mode: this.state.mode == 'edit' ? 'view' : 'edit',
            })
        }
    }
   
    initSelectFile = async (object) => {
        if (object == undefined || object.rootDir == undefined || object.rootDir.length < 1) {
            return
        }
        await this.setState(object)
        if(object.activeFile.length > 0) {
            setWindowTitle(object.activeFile)
        }
    }
    listen = async () => {
        await listen('open_folder', (event) => {
            this.openDirectory()
        })
        const {appWindow} = await require('@tauri-apps/api/window')
        appWindow.onCloseRequested(async (event) => {
            event.preventDefault()
            this.markdown.current.ask2Exit()
        });
    }

    render() {
        if (this.state.rootDir.length < 1) {
            return <div style={{ margin: '20% auto', textAlign: 'center' }}>
                <Button onClick={this.openDirectory} type="primary">Open Folder</Button>
            </div>
        }
        return (
            <div id="app" onKeyUp={this.handleKeyUp}  tabIndex="-1">
                <Layout className='layout-body'>
                    <Sider
                        resizeDirections={['right']}
                        style={{
                            minWidth: '10%',
                            maxWidth: '40%',
                            height: '100vh',
                            overflow: 'scroll',
                            overflowX: 'hidden',
                            paddingLeft: '10px'
                        }}
                        size="small"
                    >
                        <TreeDirectory rootDir={this.state.rootDir} clickFile={this.clickFileX} ref={this.directory} activeFile={this.state.activeFile}/>
                    </Sider>
                    <Content>
                        <div className="content">
                            <Markdown mode={this.state.mode} file={this.state.activeFile}  ref={this.markdown}  switch={this.clickFileX}/>
                        </div>
                    </Content>
                </Layout>
            </div>
        )
    }
}

export default App
