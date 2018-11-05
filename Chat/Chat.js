import React, {Component} from "react";
import {connect} from 'react-redux';
import io from 'socket.io-client';
import {
    Button,
    Row,
    Col,
    Card,
    Icon,
    Spin,
    Input,
    Badge,
    Avatar
} from 'antd';
const {TextArea} = Input;

class Chat extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            messages: [],
            message: '',
            symbols: 240,
            socketId: '',
            connections: [],
            image: '',
            users: []
        };

        this.socket = io(document.location.protocol + '//' + document.location.host);

        this
            .socket
            .on('RECEIVE_MESSAGE', function (data) {
                addMessage(data);
            });
        this
            .socket
            .on('INIT', (data) => {
                data.id === this.socket.id
                    ? initData(data)
                    : updOnline(data.connections)
            });
        this
            .socket
            .on('DISC', function (data) {
                updOnline(data.connections)
            });

        const addMessage = data => {
            this.setState({
                messages: [
                    ...this.state.messages,
                    data
                ]
            });
            this.scrollToBottom();

        };
        const updOnline = data => {
            this.setState({connections: data});
        };

        const initData = data => {

            this.setState(() => {

                return {connections: data.connections, messages: data.messages, socketId: this.socket.id}
            });
            this.scrollToBottom()
        };
    }
    scrollToBottom() {

        this
            .el
            .scrollIntoView({behaviour: 'smooth'});
    }
    sendMessage = (ev) => {
        ev.preventDefault();

        if (this.state.username.trim() && this.state.message.trim() && this.state.message.trim().length < 240) {
            const d = new Date();
            const minutes = d.getMinutes() >= 10
                ? d.getMinutes()
                : '0' + d.getMinutes();
            const seconds = d.getSeconds() >= 10
                ? d.getSeconds()
                : '0' + d.getSeconds();
            const time = d.getUTCDate() + '/' + (d.getUTCMonth() + 1) + ' ' + d.getHours() + ":" + minutes + ":" + seconds;

            let dataState = [...this.state.connections];

            const oneIdUser = dataState.filter(item => {
                return item.id === this.socket.id
            })

            if (oneIdUser) {
                this
                    .socket
                    .emit('SEND_MESSAGE', {
                        author: this.state.username,
                        message: this.state.message,
                        date: time,
                        id: this.socket.id,
                        color: oneIdUser[0].color,
                        image: this.state.image
                            ? this.state.image
                            : null
                    });

            }
            if (!oneIdUser) {
                return
            }

            this.setState({message: '', symbols: 240});
        }

    };

    changeAreaHandler = (event) => {

        this.setState({
            message: event.target.value,
            symbols: 240 - event.target.value.length
        });

    }
    componentDidMount = () => {
        this.setState({username: this.props.email})
    }
    componentWillUnmount = () => {
        this
            .socket
            .disconnect()
    }

    render() {

        let messagesList = <Spin size="large"/>
        if (this.state.messages.length > 0) {
            messagesList = this
                .state
                .messages
                .map((message, i) => {

                    return (
                        <div key={i} className='element'>
                            <span
                                style={{
                                color: "#b5b5b5",
                                marginRight: "25px"
                            }}>
                                {message.date}
                            </span>
                            <span
                                style={{
                                color: message.color,
                                fontWeight: 'bold'
                            }}>
                                {message.author}</span>: {message.message}
                            <p>
                                {message.image
                                    ? <img className='chatImg' alt="Плохой адрес картинки" src={message.image}/>
                                    : null}
                            </p>

                        </div>
                    )
                });
        }

        return (
            <Row>
                <Col xs={0} sm={0} md={6} lg={8} xl={6}></Col>
                <Col xs={24} sm={24} md={12} lg={8} xl={12}>
                    <div className='chatH'>
                        Чат
                        <span
                            style={{
                            float: 'right'
                        }}>
                            <Badge
                                count={this.state.connections.length}
                                style={{
                                backgroundColor: '#87d068'
                            }}><Avatar size='small' icon="user"/></Badge>

                        </span>

                    </div>
                    <Card
                        className="ChatMain"
                        style={{
                        'height': '370px',
                        "overflowY": "scroll"
                    }}>
                        <div className="messages">{messagesList}

                        </div>
                        <div
                            ref={el => {
                            this.el = el;
                        }}/>
                    </Card>
                    <Card >

                        <TextArea
                            maxLength="240"
                            rows={4}
                            value={this.state.message}
                            onChange={(event) => this.changeAreaHandler(event)}/>
                        <p>{this.state.symbols}</p>
                        <Input
                            addonBefore={< Icon type = "picture" />}
                            onChange={(event) => {
                            this.setState({image: event.target.value})
                        }}
                            defaultValue={this.state.image}/>
                        <Button
                            type='primary'
                            onClick={this.sendMessage}
                            className="btn btn-primary form-control"><Icon type="rocket"/></Button>
                    </Card>

                </Col>
                <Col xs={0} sm={0} md={6} lg={8} xl={6}></Col>
            </Row>

        );
    }
}
const mapStateToProps = (state) => ({email: state.auth.email})
export default connect(mapStateToProps)(Chat);