import React from 'react';
import { Grid } from '@arco-design/web-react';
import IconFolderSVG from '../asserts/svg/folder.js';
import IconMarkdown from '../asserts/svg/markdown';

const Row = Grid.Row;
const Col = Grid.Col;

export default function (props) {
    return <Row className="directory">
        {props.data.map(item => {
            return <Col className="directory-item" key={item.path} span={8} onClick={() => props.clickFile(item)} >
                {
                    item.item_type == 'dir' ? <IconFolderSVG height={40} width={40} /> : <IconMarkdown height={40} width={40} />
                }
                <span >{item.path}</span>
            </Col>
        })}
    </Row>
}
