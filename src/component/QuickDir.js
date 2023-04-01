import { IconObliqueLine } from '@arco-design/web-react/icon';
import { Space, Link, Grid, Button, Message, Input, Modal, Form, Radio } from '@arco-design/web-react';
import { genQuickDirs } from '@/util/common';
import { useEffect, useState } from 'react';
import { createDir, createFile } from '../util/invoke'
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Row = Grid.Row;
const Col = Grid.Col;
var tauriApiPath = null
export default function (props) {
    const [name, setName] = useState("")
    const [createType, setCreateType] = useState("file")
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        async function setup() {
            tauriApiPath = await require('@tauri-apps/api/path')
        }
        setup()
    }, [])

    const doCreate = async () => {
        let fullPath = await tauriApiPath.join(props.activeFile, name)
        let result = ''
        if (createType == 'file') {
            result = await createFile(fullPath)
        } else {
            result = await createDir(fullPath)
        }
        if (result != "ok") {
            Message.error(result)
            return
        }
        Message.success("successfully created!!")
        setVisible(false)
        props.reload()
    }

    if (props.rootDir == undefined || props.rootDir.length < 1) {
        return null
    }
    let relativeDirs = genQuickDirs(props.rootDir, props.activeFile, props.maxLevel || 5, props.sep)
    if (props.fileType == "file") {
        relativeDirs[relativeDirs.length - 1].static = true
    }
    return <>
        <Row className="quick-dir" style={{ zIndex: '10000', background: 'rgb(235, 235, 235)', padding: '3px 0', marginBottom: '10px' }}>
            <Col span={20}>
                <Space split={<IconObliqueLine />} align={'center'} size={0} style={{ fontSize: '19px' }}>
                    <Link onClick={() => props.quickSelect(props.rootDir)} key={props.rootDir}>根目录</Link>
                    {
                        relativeDirs.map(item => {
                            if (item.static != undefined && item.static) {
                                return <span key={item.path}>
                                    <strong>{item.name}</strong>
                                </span>
                            }
                            return <Link onClick={() => props.quickSelect(item.path)} key={item.path}>{item.name}</Link>
                        })
                    }
                </Space>
            </Col>
            {
                props.fileType == "dir" ? <Col span={4} style={{ textAlign: 'right', fontSize: '16px' }}>
                    <Button type='text' onClick={() => {
                        setVisible(true)
                    }}>新增</Button>
                </Col> : null
            }
        </Row>
        <Modal
            title='创建新的文件/文件夹'
            visible={visible}
            okButtonProps={{
                disabled: false,
            }}
            cancelButtonProps={{
                disabled: false,
            }}
            onCancel={() => {
                setVisible(false);
            }}
            onOk={doCreate}
        >
            <div>
                <FormItem label='类型'>
                    <RadioGroup value={createType} onChange={setCreateType}>
                        <Radio value='file'>文件</Radio>
                        <Radio value='dir'>文件夹</Radio>
                    </RadioGroup>
                </FormItem>
                <FormItem label='名字'>
                    <Input placeholder='请输入名称' autoComplete={'false'} onChange={setName} />
                </FormItem>
            </div>
        </Modal>
    </>
}