import React, {Component} from 'react';
import 'jsoneditor/dist/jsoneditor.css';
export default class JSONEditor extends Component {
    jsoneditor  = null;
    container  = null;
    constructor(props) {
        super(props); // 用于父子组件传值
    }
    async componentDidMount () {
        const options = {
            mode: 'code',
            onValidate: this.props.onValidate,
            templates : this.props.templates,
            onChangeText : this.props.onChangeText,
        };
        const JSONEditor = await require('jsoneditor')
        this.jsoneditor = new JSONEditor(this.container, options);
        this.jsoneditor.set(this.props.json);
    }
    componentWillUnmount () {
        if (this.jsoneditor) {
            this.jsoneditor.destroy();
        }
    }
    set = (json) => {
        if (this.jsoneditor) {
            this.jsoneditor.update(json);
        }
    }
    get = () => {
        if(this.jsoneditor) {
            return this.jsoneditor.get()
        }
    }
    render() {
        return (
            <div style={{height: this.props.height}} ref={elem => this.container = elem} />
        );
    }
}