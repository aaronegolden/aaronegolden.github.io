const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ox = canvas.width / 2;
const oy = canvas.height / 2;
const r = 200;
let theta0 = 0;
let phi0 = 0;
let theta = 0;
let phi = 0;
let mousePos = {x: 0, y: 0};
let dragging = false;
let colors = ['red', 'green', 'blue', 'orange'];


let n = [];
let j = 0;
for (x = 0; x <= 1; x++) {
    for (y = 0; y <= 1; y++) {
        for (z = 0; z <= 1; z++) {
            for (w = 0; w <= 1; w++) {
                n[j++] = [x, y, z, w];
            }
        }
    }
}

let v = [];
let vj = 0;
for (j = 0; j < 16; j++) {
    for (k = j + 1; k < 16; k++) {
        let s = 0;
        let c = "";
        for (d = 0; d < 4; d++) {
            dd = Math.abs(n[j][d] - n[k][d]);
            if (dd == 1) {
                c = colors[d];
            }
            s += dd;
        }
        if (s == 1) {
            v[vj++] = [j, k, c];
        }
    }
}
console.log(v);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (j = 0; j < 32; j++) {
        ctx.beginPath();
        let n0 = n[v[j][0]];
        let n1 = n[v[j][1]];
        let x0 = n0[0] - 0.5;
        let y0 = n0[1] - 0.5;
        let z0 = n0[2] - 0.5;
        let w0 = n0[3] - 0.5;
        let x1 = n1[0] - 0.5;
        let y1 = n1[1] - 0.5;
        let z1 = n1[2] - 0.5;
        let w1 = n1[3] - 0.5;

        let xx0 = x0 * Math.cos(theta) + z0 * Math.sin(theta)*Math.sin(phi) - w0*Math.cos(theta)*Math.sin(phi);
        let yy0 = y0 * Math.cos(phi) + x0 * Math.sin(theta)*Math.sin(phi) - z0*Math.cos(theta)*Math.sin(phi);
        let xx1 = x1 * Math.cos(theta) + z1 * Math.sin(theta)*Math.sin(phi) - w1*Math.cos(theta)*Math.sin(phi);
        let yy1 = y1 * Math.cos(phi) + x1 * Math.sin(theta)*Math.sin(phi) - z1*Math.cos(theta)*Math.sin(phi);

        ctx.moveTo(ox + xx0 * r, oy + yy0 * r);
        ctx.lineTo(ox + xx1 * r, oy + yy1 * r);
        ctx.strokeStyle = v[j][2];
        ctx.stroke();
    }
}

draw();

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  canvas.addEventListener('mousedown', (e) => {
    theta0 = theta;
    phi0 = phi;
    mousePos = getMousePos(canvas, e);
    dragging = true;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (dragging) {
      nm = getMousePos(canvas, e);
      const dx = nm.x - mousePos.x;
      const dy = nm.y - mousePos.y;
      theta = theta0 - dx * Math.PI / 32;
      phi = phi0 + dy * Math.PI / 32;
      draw();
    }
  });

  canvas.addEventListener('mouseup', () => {
    dragging = false;
  });

  canvas.addEventListener('mouseout', () => {
    dragging = false;
  });

