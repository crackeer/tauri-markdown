import React from 'react';
import IconFolderSVG from '../asserts/svg/folder.js';
import IconMarkdown from '../asserts/svg/markdown';
import { List } from '@arco-design/web-react';

const App = (props) => {
    return <div className='directory'>
        {props.data.map(item => {
            return <div className="directory-item" key={item.path} onClick={() => props.clickFile(item)} >
                {
                    item.item_type == 'dir' ? <IconFolderSVG height={30} width={30} /> : <IconMarkdown height={30} width={30} />
                }
                <span >{item.path}</span>
            </div>
        })}
    </div>
};

export default App;
