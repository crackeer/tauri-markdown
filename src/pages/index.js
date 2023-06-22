import React from 'react';
import { Button, Layout, Affix, Tabs, Modal, Message } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import { listen } from '@tauri-apps/api/event'
import MDView from '@/component/MDView';
import MDEdit from '@/component/MDEdit';
import TreeDirectory from '@/component/TreeDirectory';
import { setWindowTitle } from '../util/invoke'
import utilFs from '../util/fs'
import { uploadFile, readFile, writeFile } from '@/util/invoke'
import { IconEdit } from '@arco-design/web-react/icon';
const Sider = Layout.Sider;
const Content = Layout.Content;
const TabPane = Tabs.TabPane;
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
            file: '',
            openFiles: [],
            value: '',
            sep: '/',
            editValue: ''
        }
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
        setTimeout(() => this.loadFileContent(), 0)
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
        let index = this.state.openFiles.indexOf(key)
        let lastOne = index === this.state.openFiles.length - 1
        await this.setState({
            openFiles: this.state.openFiles.filter(file => {
                return file !== key
            })
        })

        if (this.state.openFiles.length < 1) {
            await this.setState({
                file : ''
            })
            return
        }

        if (key == this.state.file) {
            if(lastOne) {
                await this.setState({
                    file: this.state.openFiles[this.state.openFiles.length - 1]
                })
            } else {
                await this.setState({
                    file: this.state.openFiles[index]
                })
            }
            this.loadFileContent()
        }
        
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
            openFiles: this.state.openFiles,
        })
    }
    clickFileX = async (file) => {
        if (file == this.state.file) return
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
    showEdit = async () => {
        this.setState({
            visible: true,
            editValue: this.state.value
        })
    }
    saveFile = async () => {
        if (this.state.editValue !== this.state.value) {
            await writeFile(this.state.file, this.state.editValue)
            Message.success("保存成功")
            await this.setState({
                visible: false,
                value: this.state.editValue,
            })
        }
    }
    formatOpenFiles = () => {
        let retData = []
        for (var i in this.state.openFiles) {
            let parts = this.state.openFiles[i].split(this.state.sep)
            if (parts.length > 0) {
                retData.push({
                    'key': this.state.openFiles[i],
                    'title': parts[parts.length - 1]
                })
            }
        }
        return retData
    }

    render() {
        if (this.state.rootDir.length < 1) {
            return <div style={{ margin: '20% auto', textAlign: 'center' }}>
                <Button onClick={this.openDirectory} type="primary">Open Folder</Button>
            </div>
        }

        let openFiles = this.formatOpenFiles()
        return (
            <div id="app" tabIndex="-1">
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
                        <TreeDirectory rootDir={this.state.rootDir} clickFile={this.clickFileX} activeFile={this.state.file} />
                    </Sider>
                    <Content>
                        <Affix offsetTop={1} affixStyle={{ top: 0 }}>
                            <Tabs
                                defaultActiveTab={this.state.activeFile}
                                onChange={this.clickFileX}
                                activeTab={this.state.file}
                                editable
                                addButton={<></>}
                                overflow={'scroll'}
                                onDeleteTab={this.closeFile}
                                style={{ background: 'white' }}
                            >
                                {openFiles.map((file) => {
                                    return <TabPane key={file.key} title={file.title} closable></TabPane>
                                })}
                            </Tabs>
                        </Affix>
                        {
                            this.state.file.length > 0 ? <div className="content">
                                <MDView value={this.state.value} sep={this.state.sep} file={this.state.file} />
                                <div style={{ right: '50px', position: 'fixed', bottom: '50px' }}>
                                    <Button type='primary' size='small' shape='round' icon={<IconEdit />} onClick={this.showEdit}></Button>
                                </div>
                            </div> : null
                        }

                        <Modal visible={this.state.visible} onCancel={() => {
                            this.setState({ visible: false });
                        }} onOk={this.saveFile} style={{ width: '90%', height: '90%' }} title={this.state.file}>
                            <MDEdit value={this.state.editValue} sep={this.state.sep} file={this.state.file} onChange={
                                (value) => {
                                    this.setState({ editValue: value });
                                }
                            } />
                        </Modal>
                    </Content>

                </Layout>
            </div >
        )
    }
}

export default App
