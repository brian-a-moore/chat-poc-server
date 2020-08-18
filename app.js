const express = require('express');
const socketio = require('socket.io');
const PORT = 3001;
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const io = socketio(server, { origins: 'http://localhost:3000'});
const moment = require('moment');

server.listen(PORT, () => console.log(`Server online ${PORT}`));

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => res.send('<h1>Hello world!</h1>'));

let USERS = [];

io.on('connection', socket => {

    socket.on('join', user => {
        USERS = [...USERS, { id: socket.id, name: user, time: moment().format() }];
        socket.broadcast.emit('chat', {
            id: Math.random(),
            type: 'bot',
            text: `${user} has joined the chat`,
            timestamp: moment().format('h:mm a'),
        });
        io.emit('users', USERS);
    });

    socket.on('chat', chat => {
        io.emit('chat', {
            id: Math.random(),
            type: 'message',
            text: chat.message,
            user: chat.user,
            timestamp: moment().format('h:mm a')
        });
    });

    socket.on('typing', info => {
        io.emit('typed', info);
    });

    socket.on('disconnect', () => {
        let id = socket.id;
        let user = getUser(id, USERS);
        USERS = updateUsers(id, USERS);

        if(user) {
            io.emit('chat', {
                id: Math.random(),
                type: 'bot',
                text: `${user.name} has left the chat`,
                timestamp: moment().format('h:mm a'),
            });
        }

        io.emit('users', USERS);
    });
});

const getUser = (id, users) => {
    return users.find(user => user.id === id);
}

const updateUsers = (id, users) => {
    return users.filter(user => user.id !== id);
}