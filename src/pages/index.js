import React from 'react';
import { Button, Layout, Affix, Tabs } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import { listen } from '@tauri-apps/api/event'
import Markdown from '@/component/Markdown';
import MDView from '@/component/MDView';
import TreeDirectory from '@/component/TreeDirectory';
import { setWindowTitle } from '../util/invoke'
import utilFs from '../util/fs'
import { uploadFile, readFile, writeFile } from '@/util/invoke'

const Sider = Layout.Sider;
const Content = Layout.Content;
const TabPane = Tabs.TabPane;
class App extends React.Component {
    directory = null;
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
            file: '',
            openFiles: [],
            mode: 'view',
            value: '',
            sep: '/'
        }
        this.directory = React.createRef()
        this.markdown = React.createRef()
    }
    async componentDidMount() {
        this.initData()
    }
    async initData() {
        let object = await utilFs.getLoadConfig()
       
        if (object == undefined || object.rootDir == undefined || object.rootDir.length < 1) {
            return
        }
        const { sep } = await import('@tauri-apps/api/path')
        object['sep'] = sep
        await this.setState(object)
        setTimeout(() => this.loadFileContent(),0)
        await listen('open_folder', (event) => {
            this.openDirectory()
        })
        await listen('select_file', (event) => {
           this.clickFileX(event.payload.file)
        })
    }
    openDirectory = async () => {
        const { homeDir } = await import('@tauri-apps/api/path')
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
    closeFile = async (key) => {
        await this.setState({
            openFiles: this.state.openFiles.filter(file => {
                return file !== key
            })
        })
        if (key == this.state.file && this.state.openFiles.length > 0) {
            await this.setState({
                file: this.state.openFiles[0]
            })
        }
        this.loadFileContent()
    };
    loadFileContent = async () => {
        if (this.state.file.length < 1) {
            return
        }
        let data = await readFile(this.state.file)
        await this.setState({
            value: data
        })
        this.decorateWindow()
    }
    decorateWindow = () => {
        setWindowTitle(this.state.file)
        utilFs.setLoadConfig({
            rootDir: this.state.rootDir,
            file: this.state.file,
            mode: this.state.mode,
            openFiles: this.state.openFiles,
        })
    }
    clickFileX = async (file) => {
        if(file == this.state.file) return
        await this.setState({
            file: file,
        })
        if (this.state.openFiles.indexOf(file) < 0) {
            this.setState({
                openFiles: [...this.state.openFiles, file]
            })
        }
        setTimeout(this.loadFileContent, 0)
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
                mode: this.state.mode == 'edit' ? 'view' : 'edit',
            })
            utilFs.setLoadConfig({
                rootDir: this.state.rootDir,
                file: this.state.activeFile,
                mode: this.state.mode == 'edit' ? 'view' : 'edit',
            })
        }
    }

    render() {
        if (this.state.rootDir.length < 1) {
            return <div style={{ margin: '20% auto', textAlign: 'center' }}>
                <Button onClick={this.openDirectory} type="primary">Open Folder</Button>
            </div>
        }
        return (
            <div id="app" onKeyUp={this.handleKeyUp} tabIndex="-1">
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
                        <TreeDirectory rootDir={this.state.rootDir} clickFile={this.clickFileX} ref={this.directory} activeFile={this.state.file} />
                    </Sider>
                    <Content>
                        <Affix offsetTop={1} affixStyle={{top:0}}>
                            <Tabs
                                defaultActiveTab={this.state.activeFile}
                                onChange={this.clickFileX}
                                activeTab={this.state.file}
                                editable
                                addButton={<></>}
                                overflow={'scroll'}
                                onDeleteTab={this.closeFile}
                                style={{background:'white'}}
                            >
                                {this.state.openFiles.map((file) => {
                                    return <TabPane key={file} title={file} closable></TabPane>
                                })}
                            </Tabs>
                        </Affix>
                        <div className="content">
                            <MDView value={this.state.value} sep={this.state.sep} file={this.state.file} />
                        </div>
                    </Content>
                </Layout>
            </div >
        )
    }
}

export default App
