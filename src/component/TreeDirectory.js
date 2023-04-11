import React from 'react';
import { Tree } from '@arco-design/web-react';
import { simpleReadDir } from '../util/invoke'
import { sortFileList } from '@/util/common';
import { IconDown } from '@arco-design/web-react/icon';


const getSubDir = async (dir) => {
    let fileList = await simpleReadDir(dir, ".md")
    fileList = sortFileList(fileList)
    const { join } = await import('@tauri-apps/api/path')
    let children = []
    for (var i in fileList) {
        let key = await join(dir, fileList[i].path)
        let child = {
            title: fileList[i].path,
            key: key,
            isLeaf: fileList[i].item_type == 'file',
        }
        children.push(child)
    }
    return children
}

const TreeDirectory = React.forwardRef((props, ref) => {
    const [treeData, setTreeData] = React.useState([]);
    React.useImperativeHandle(
        ref,
        () => ({ initData })
    );

    var initData = async (dir) => {
        let children = await getSubDir(dir)
        const { sep } = await import('@tauri-apps/api/path')
        let parts = dir.split(sep);
        let title = parts[parts.length - 1]
        if(parts[parts.length - 1].length < 1) {
            title = parts.join('')
        }
        setTreeData(children)
    }
    const loadMore = async (treeNode) => {
        if(treeNode.props.children != undefined) {
            return
        }
        treeNode.props.dataRef.children = await getSubDir(treeNode.key)
        setTreeData([...treeData]);
    };
    React.useEffect(() => {
        initData(props.rootDir)
    }, [])

    return <Tree icons={{
        switcherIcon: <IconDown />,
    }} autoExpandParent={true} defaultExpandedKeys={[props.rootDir]}  loadMore={loadMore} treeData={treeData} onSelect={(value, info) => {
        if (info.node.props.isLeaf) {
            props.clickFile(info.node.props.dataRef.key)
        }
    }} size='small' actionOnClick={['expand', 'select']} ></Tree>;
})

export default TreeDirectory;