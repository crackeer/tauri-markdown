import React from 'react';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rootDir: '',
            activeFile: '',
            mode: 'view',
        }
    }
    htmlTitle() {
        return <h3>
            首页
        </h3>
    }
    async componentDidMount() {
    }
    render() {
        
        return (
            <div id="app">
                 Rust YYDS
            </div>
        )
    }
}

export default App
