const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const uuid = require('uuid');

const members = {
    a: {
        username: 'x',
        coordinates: { x: -64, y: 0 },
        body: 2,
        hat: 1,
        outfit: 1,
        sleeping: true
    }
};

let clients = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

require("dotenv").config();

function randomStep(start, end, step) {
    let randomNumber = (Math.random() * (end - start) + start).toFixed(4);
    return randomNumber - randomNumber % step;
}

const port = process.env.NODE_DOCKER_PORT || 3000;

app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));

    if (members[req.query.id] === undefined) {
        res.redirect('/register');
    }
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/register', (req, res) => {
    const id = uuid.v4();

    if (Object.values(members).some(e => e.username === req.body.username)) {
        res.send('Kullanıcı zaten var');
        res.sendStatus(403);
        return;
    };

    members[id] = {
        username: req.body.username,
        coordinates: { x: Math.floor(randomStep(0, 640, 5)), y: Math.floor(randomStep(0, 480, 5)) },
        body: req.body.body,
        hat: req.body.hat,
        outfit: req.body.outfit,
        sleeping: true
    };

    res.redirect(`/game/?id=${id}`);
});

app.use(express.static('public'));

io.on('connection', client => {
    client.on('move', msg => {
        if (members[msg.id] === undefined) return;

        members[msg.id].coordinates.x += msg.to.x;
        members[msg.id].coordinates.y += msg.to.y;

        io.emit('moved', {
            members: Object.values(members),
            character: members[msg.id]
        });
    });

    client.on('create', msg => {
        clients[client.id] = msg.id;

        members[msg.id].sleeping = false;

        io.emit('created', {
            members: Object.values(members),
            character: members[msg.id]
        });
    });

    client.on('new message', msg => {
        io.emit('message received', {
            username: members[msg.id].username,
            message: msg.message
        });
    });

    console.log(client.id);

    client.on('disconnect', () => {
        if (clients[client.id] !== undefined && 
            members[clients[client.id]] !== undefined) {
            members[clients[client.id]].sleeping = true;
        }
    });
});

http.listen(port, () => {
    console.log(`Server running at: http://localhost:${port}/`);
});