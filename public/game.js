let socket = io();

let members = [];

let skin = {};

let character = {};

let id = new URLSearchParams(window.location.search).get('id');

let grassImg;
let plantImg;

let messages = [];

let view;

function preload() {
    grassImg = loadImage('/grass.png');
    plantImg = loadImage('/plant.png');
    
    fetch('/skin.json').then(r => r.json()).then(d => {
        skin.bodies = d.bodies.map(e => loadImage(e));
        skin.hats = d.hats.map(e => loadImage(e));
        skin.outfits = d.outfits.map(e => loadImage(e));
    });

    skin.sleeping = loadImage('/skin/sleeping.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    socket.emit('create', { id: id });
}

function draw() {
    background(0, 160, 0);

    for (let i = -height / 64; i < height * 4 / 64; i++) {    
        for (let j = -width / 64; j < width * 4 / 64; j++) {       
            image(grassImg, j * 64, i * 64);

            if (Math.floor(i * j * i / 2 + Math.abs(i - j)) % 2 !== 0) {
                image(plantImg, j * 64, i * 64);
            }
        }
    }


    if (!character.coordinates) return;

    members.forEach(m => {
        if (!skin.bodies[Number(m.body)]) return;
        if (!skin.hats[Number(m.hat)]) return;
        if (!skin.outfits[Number(m.outfit)]) return;


        image(skin.bodies[Number(m.body)], m.coordinates.x - 32, m.coordinates.y - 32);
        image(skin.hats[Number(m.hat)], m.coordinates.x - 32, m.coordinates.y - 32);
        image(skin.outfits[Number(m.outfit)], m.coordinates.x - 32, m.coordinates.y - 32);

        if (m.sleeping) {
            image(skin.sleeping, m.coordinates.x - 32, m.coordinates.y - 32);

            push();
            let colFill = color('goldenrod');
            colFill.setAlpha(150);
            fill(colFill);

            let colStroke = color('gold');
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

        if (messages.some(e => (new Date()) - e.time < 2000 && e.username === m.username)) {
            push();

            let alpha = 150 + sin(frameCount * 0.2) * 50;

            colFill = color(255);
            colFill.setAlpha(alpha);

            fill(colFill);
            strokeWeight(4);
            
            stroke(0);
            
            beginShape();
            vertex(m.coordinates.x + 46, m.coordinates.y - 64);
            vertex(m.coordinates.x + 102, m.coordinates.y - 64);
            vertex(m.coordinates.x + 102, m.coordinates.y - 96);
            vertex(m.coordinates.x + 30, m.coordinates.y - 96);
            vertex(m.coordinates.x + 30, m.coordinates.y - 70);
            vertex(m.coordinates.x + 24, m.coordinates.y - 52);
            vertex(m.coordinates.x + 46, m.coordinates.y - 64);
            endShape();

            colFill = color(0);
            colFill.setAlpha(alpha);
            fill(colFill);
            noStroke();

            circle(m.coordinates.x + 50, m.coordinates.y - 80, 10);
            circle(m.coordinates.x + 65, m.coordinates.y - 80, 10);
            circle(m.coordinates.x + 80, m.coordinates.y - 80, 10);

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

        if (m.coordinates.x - 32 > width && m.coordinates.y - 64 > height) {
            push();
            translate(width - 16, height - 16);
            text(m.username, 0, 0);
            pop();
        }
        if (m.coordinates.x + 32 < 0 && m.coordinates.y - 64 > height) {
            push();
            translate(16, height - 16);
            text(m.username, 0, 0);
            pop();
        }
        if (m.coordinates.x + 32 < 0 && m.coordinates.y + 64 < 0) {
            push();
            translate(16, 16);
            text(m.username, 0, 0);
            pop();
        }
        if (m.coordinates.x - 32 > width && m.coordinates.y + 64 < 0) {
            push();
            translate(width - 16, 16);
            text(m.username, 0, 0);
            pop();
        }
    });

    const moveTo = (toWhere) => {
        if (document.activeElement.id === 'panel-input') return;
        socket.emit('move', {
            id: id,
            to: toWhere
        });
    }

    let to = {
        x: 0,
        y: 0
    };

    if (keyIsDown(65)) {
        to.x += -5;
    }

    if (keyIsDown(68)) {
        to.x += 5;
    }

    if (keyIsDown(87)) {
        to.y += -5;
    }

    if (keyIsDown(83)) {
        to.y += 5;
    }
    
    moveTo(to);

    messages.slice(0, 10).forEach((e, i) => {
        noStroke();

        col = color(255);
        col.setAlpha(200);
        fill(col);

        textSize(12);
        textAlign(LEFT);
        text(`${e.username}: ${e.message}`, width - 360, height - 30 - i * 32, 340, 40);
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
    const message = msg;
    message.time = new Date();

    messages.unshift(message);
});

document.querySelector('#edit-button').href = `/edit/?id=${id}`;