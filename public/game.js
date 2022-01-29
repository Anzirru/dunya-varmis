let socket = io();

let members = [];

let skin = {};

function setup() {
    createCanvas(640, 480);
    
    fetch('/skin.json').then(r => r.json()).then(d => {
        skin.bodies = d.bodies.map(e => loadImage(e));
        skin.hats = d.hats.map(e => loadImage(e));
        skin.outfits = d.outfits.map(e => loadImage(e));
    });
}

function draw() {
    background(0, 160, 0);

    members.forEach(m => {
        image(skin.bodies[Number(m.body)], m.coordinates.x - 8, m.coordinates.y - 8);
        image(skin.hats[Number(m.hat)], m.coordinates.x - 8, m.coordinates.y - 8);
        image(skin.outfits[Number(m.outfit)], m.coordinates.x - 8, m.coordinates.y - 8);

        noStroke();
        fill(255);
        textAlign(CENTER);
        text(m.username, m.coordinates.x, m.coordinates.y - 8);
    });
}

function mouseMoved(e) {
    socket.emit('move', {
        id: new URLSearchParams(window.location.search).get('id'),
        coordinates: { x: e.clientX, y: e.clientY }
    });
}

socket.on('moved', msg => {
    members = msg.members;
});

socket.on('created', msg => {
    members = msg.members;
})