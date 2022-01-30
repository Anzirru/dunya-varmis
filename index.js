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
        username: 'Adem',
        coordinates: { x: -64, y: -64 },
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
        body: Number(req.body.body),
        hat: Number(req.body.hat),
        outfit: Number(req.body.outfit),
        sleeping: true
    };

    res.redirect(`/game/?id=${id}`);
});

app.get('/edit', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/edit', (req, res) => {
    if (members[req.query.id] === undefined) {
        res.redirect('/register');
    }
    else {
        members[req.query.id].username = req.body.username;
        members[req.query.id].body = Number(req.body.body);
        members[req.query.id].hat = Number(req.body.hat);
        members[req.query.id].outfit = Number(req.body.outfit);

        res.redirect(`/game/?id=${req.query.id}`);
    }

});

app.get('/user', (req, res) => {
    if (req.query.id) {
        res.json({
            username: members[req.query.id].username,
            body: Number(members[req.query.id].body),
            hat: Number(members[req.query.id].hat),
            outfit: Number(members[req.query.id].outfit)
        });
    }
    else {
        res.json({
            username: '',
            body: 0,
            hat: 0,
            outfit: 0
        });
    }

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

        members[msg.id].sleeping = false;
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