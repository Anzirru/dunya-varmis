let socket = io();

let members = [];

let skin = {};

let character = {};

let id = new URLSearchParams(window.location.search).get('id');

let grassImg;

let messages = [];

function preload() {
    grassImg = loadImage('/grass.png');
    
    fetch('/skin.json').then(r => r.json()).then(d => {
        skin.bodies = d.bodies.map(e => loadImage(e));
        skin.hats = d.hats.map(e => loadImage(e));
        skin.outfits = d.outfits.map(e => loadImage(e));
    });
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);

    socket.emit('create', { id: id });
}

function draw() {
    background(0, 160, 0);

    for (let i = 0; i < height / 64; i++) {    
        for (let j = 0; j < width / 64; j++) {       
            image(grassImg, j * 64, i * 64);
        }
    }

    if (!character.coordinates) return;

    members.forEach(m => {
        image(skin.bodies[Number(m.body)], m.coordinates.x - 32, m.coordinates.y - 32);
        image(skin.hats[Number(m.hat)], m.coordinates.x - 32, m.coordinates.y - 32);
        image(skin.outfits[Number(m.outfit)], m.coordinates.x - 32, m.coordinates.y - 32);

        noStroke();
        fill(255);
        textAlign(CENTER);
        text(m.username, m.coordinates.x, m.coordinates.y - 40);
    });

    const moveTo = (toWhere) => {
        socket.emit('move', {
            id: id,
            to: toWhere
        });
    }

    if (keyIsDown(65)) {
        moveTo({
            x: -5,
            y: 0
        });
    }

    if (keyIsDown(68)) {
        moveTo({
            x: 5,
            y: 0
        });
    }

    if (keyIsDown(87)) {
        moveTo({
            x: 0,
            y: -5
        });
    }

    if (keyIsDown(83)) {
        moveTo({
            x: 0,
            y: 5
        });
    }

    messages.slice(0, 10).forEach((e, i) => {
        col = color(255);
        col.setAlpha(120);
        fill(col);

        textSize(16);
        textAlign(LEFT);
        text(`${e.username}: ${e.message}`, width - 300, height - 30 - i * 20, 300, 40);
    });
}

socket.on('moved', msg => {
    members = msg.members;
    character = msg.character;
});

socket.on('created', msg => {
    members = msg.members;
    character = msg.character;
});

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

document.querySelector('#form-panel').addEventListener('submit', e => {
    e.preventDefault();
    socket.emit('new message', {
        id: id,
        message: document.querySelector('#panel-input').value
    });

    const inp = document.querySelector('#panel-input').value = '';
});

socket.on('message received', msg => {
    messages.unshift(msg);
});