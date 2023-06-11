import React from 'react';
import { Card, Avatar, Link, Typography, Space, Row } from '@arco-design/web-react';
import { IconArrowRight } from '@arco-design/web-react/icon';
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    htmlTitle() {
        return <h3>
            主页
        </h3>
    }
    async componentDidMount() {
    }
    render() {

        return (
            <div id="app">
                <Card title='推荐站点'>
                    <Space size={'large'}>
                        <Link href='https://tauri.app/zh-cn/' target='_blank'>Tauri.App</Link>
                        <Link href='https://arco.design/' target='_blank'>Arco.Design</Link>
                        <Link href='https://doc.rust-lang.org/std/index.html' target='_blank'>doc.rust-lang.org</Link>
                        <Link href='https://doc.rust-lang.org/book/title-page.html' target='_blank'>doc.rust-lang.org/Book</Link>
                        <Link href='https://course.rs/about-book.html' target='_blank'>Rust语言圣经</Link>
                        <Link href='https://google.github.io/comprehensive-rust/' target='_blank'>Google的一本教学书</Link>
                    </Space>
                </Card>
                <Card title='Q&A'>
                    <Space size={'large'}>
                        <Link href='https://github.com/tauri-apps/tauri/discussions/3059' target='_blank'>DevTools in release mode</Link>
                    </Space>
                </Card>
            </div>
        )
    }
}

export default App
