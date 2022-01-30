let socket = io();

let members = [];

let skin = {};

let character = {};

let id = new URLSearchParams(window.location.search).get('id');

let grassImg;

let messages = [];

let view;

function preload() {
    grassImg = loadImage('/grass.png');
    
    fetch('/skin.json').then(r => r.json()).then(d => {
        skin.bodies = d.bodies.map(e => loadImage(e));
        skin.hats = d.hats.map(e => loadImage(e));
        skin.outfits = d.outfits.map(e => loadImage(e));
    });

    skin.sleeping = loadImage('/skin/sleeping.png');
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);

    socket.emit('create', { id: id });

    view = createVector(0, 0);
}

function draw() {
    background(0, 160, 0);

    view = p5.Vector.lerp(view, createVector(-mouseX, -mouseY), 0.005);

    // translate(view.x, view.y);

    for (let i = -height / 64; i < height * 4 / 64; i++) {    
        for (let j = -width / 64; j < width * 4 / 64; j++) {       
            image(grassImg, j * 64, i * 64);
        }
    }


    if (!character.coordinates) return;

    members.forEach(m => {
        image(skin.bodies[Number(m.body)], m.coordinates.x - 32, m.coordinates.y - 32);
        image(skin.hats[Number(m.hat)], m.coordinates.x - 32, m.coordinates.y - 32);
        image(skin.outfits[Number(m.outfit)], m.coordinates.x - 32, m.coordinates.y - 32);

        if (m.sleeping) {
            image(skin.sleeping, m.coordinates.x - 32, m.coordinates.y - 32);

            push();
            colFill = color('goldenrod');
            colFill.setAlpha(150);
            fill(colFill);

            colStroke = color('gold');
            colStroke.setAlpha(180);
            stroke(colStroke);

            textFont('monospace');
            textSize(20);
            textStyle(BOLD);
            translate(m.coordinates.x + 16 + 16 * sin(frameCount * 0.01), m.coordinates.y - 20 - 4 * cos(frameCount * 0.02));
            rotate(-PI * 0.05 * sin(-frameCount * 0.005));
            text('Zzz', 0, 0);
            pop();
        }

        noStroke();
        fill(255);
        stroke(0);
        textAlign(CENTER);
        textSize(16);
        textStyle(BOLD);
        text(m.username, m.coordinates.x, m.coordinates.y - 40);

        if (m.coordinates.x - 32 > width) {
            push();
            translate(width - 16, m.coordinates.y);
            rotate(-HALF_PI);
            text(m.username, 0, 0);
            pop();
        }
        if (m.coordinates.y - 64 > height) {
            push();
            translate(m.coordinates.x, height - 16);
            text(m.username, 0, 0);
            pop();
        }
        if (m.coordinates.x + 32 < 0) {
            push();
            translate(16, m.coordinates.y);
            rotate(HALF_PI);
            text(m.username, 0, 0);
            pop();
        }
        if (m.coordinates.y + 64 < 0) {
            push();
            translate(m.coordinates.x, 16);
            text(m.username, 0, 0);
            pop();
        }
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
        col.setAlpha(200);
        fill(col);

        textSize(12);
        textAlign(LEFT);
        text(`${e.username}: ${e.message}`, width - 360, height - 30 - i * 32, 380, 40);
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

    const inp = document.querySelector('#panel-input');

    inp.value = '';
    inp.blur();
});

socket.on('message received', msg => {
    messages.unshift(msg);
});

document.querySelector('#edit-button').href = `/edit/?id=${id}`;