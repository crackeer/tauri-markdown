import ReactDOM from 'react-dom';
import React from 'react';
import { Modal, Input, Tag } from '@arco-design/web-react';
import { createFile, deleteFile, createDir, deleteFolder, renameFile } from '../util/invoke'
function showEdit(node, action, callback) {
    console.log(node, action)
    if (action == 'rename') {
        ReactDOM.render(
            <RenameX node={node} callback={callback} />,
            document.getElementById('plugin-id')
        )
        return
    }
    if (action == 'new_file') {
        ReactDOM.render(
            <NewFile node={node} callback={callback} />,
            document.getElementById('plugin-id')
        )
        return
    }

    if (action == 'new_folder') {
        ReactDOM.render(
            <NewFolder node={node} callback={callback} />,
            document.getElementById('plugin-id')
        )
        return
    }

    if (action == 'delete_file') {
        ReactDOM.render(
            <DeleteFile node={node} callback={callback} />,
            document.getElementById('plugin-id')
        )
        return
    }
}

function hideEdit() {
    ReactDOM.render(
        <></>,
        document.getElementById('plugin-id')
    )
}

const RenameX = (props) => {
    const [name, setName] = React.useState(props.node.title)
    var doUpdateName = async () => {
        const { join, sep } = await require('@tauri-apps/api/path');
        let parts = props.node._key.split(sep)
        parts[parts.length - 1] = name
        let path = await join(...parts)
        let result = await renameFile(props.node._key, path)
        if (props.callback != null) {
            props.callback()
        }
        hideEdit()
    }
    return <Modal title={<div style={{ textAlign: 'left' }}>{'修改文件名'}</div>} visible={true} okText="确认" onOk={doUpdateName} onCancel={hideEdit} width="70%" bodyStyle={{ padding: '1px 10px' }}>
        <div style={{ padding: '20px' }}>
            <Input value={name} onChange={setName} />
        </div>
    </Modal>
}

const NewFile = (props) => {
    const [name, setName] = React.useState('')
    var doCreate = async () => {
        const { join } = await require('@tauri-apps/api/path');
        let path = await join(props.node._key, name);
        if (!name.endsWith('.md')) {
            path = path + '.md';
        }
        let result = await createFile(path)
        if (props.callback != null) {
            props.callback()
        }
        hideEdit()
    }
    return <Modal title={<div style={{ textAlign: 'left' }}>新建文件</div>} visible={true} okText="确认" onOk={doCreate} onCancel={hideEdit} width="70%" bodyStyle={{ padding: '1px 10px' }}>
        <div style={{ padding: '20px' }}>
            <Input value={name} onChange={setName} />
        </div>

    </Modal>
}

const NewFolder = (props) => {
    const [name, setName] = React.useState('')
    var doCreate = async () => {
        const { join } = await require('@tauri-apps/api/path');
        let path = await join(props.node._key, name);
        let result = await createDir(path)
        if (props.callback != null) {
            props.callback()
        }
        hideEdit()
    }
    return <Modal title={<div style={{ textAlign: 'left' }}>新建文件夹</div>} visible={true} okText="确认" onOk={doCreate} onCancel={hideEdit} width="70%" bodyStyle={{ padding: '1px 10px' }}>
        <div style={{ padding: '20px' }}>
            <Input value={name} onChange={setName} />
        </div>

    </Modal>
}

const DeleteFile = (props) => {
    var doDelete = async () => {
        if (!props.node.isLeaf) {
            await deleteFolder(props.node._key)
        } else {
            await deleteFile(props.node._key)
        }
        if (props.callback != null) {
            props.callback()
        }
        hideEdit()
    }
    return <Modal title={<div style={{ textAlign: 'left' }}>删除确认</div>} visible={true} okText="确认" onOk={doDelete} onCancel={hideEdit} width="70%" bodyStyle={{ padding: '1px 10px' }}>
        <div style={{ padding: '20px' }}>
            是否删除该文件（夹)，删除之后无法恢复？
            <p>
                <Tag size='large'>{props.node._key}</Tag>
            </p>
        </div>
    </Modal>
}

export {
    showEdit, hideEdit,
}