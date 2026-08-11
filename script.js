// --- GLOBAL VARIABLES ---
let currentMode = 'pole'; // Options: 'pole', 'zero', 'delete'
let poles = [];
let zeros = [];
let draggedRoot = null;

const canvas = document.getElementById('zPlaneCanvas');
const ctx = canvas.getContext('2d');

// --- COORDINATE CONVERSION HELPERS ---
// Scale factor to convert complex plane (-2 to +2) to canvas coordinates
const SCALE = 120; 

function pixelToComplex(x, y) {
    return { 
        re: (x - canvas.width / 2) / SCALE, 
        im: -(y - canvas.height / 2) / SCALE 
    };
}

function complexToPixel(re, im) {
    return { 
        x: canvas.width / 2 + re * SCALE, 
        y: canvas.height / 2 - im * SCALE 
    };
}

// --- CANVAS RENDERING ---
function drawZPlane() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw grid axes
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // Draw Unit Circle
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, SCALE, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw Zeros ('o')
    ctx.strokeStyle = '#1e88e5';
    ctx.lineWidth = 2;
    zeros.forEach(z => {
        const pt = complexToPixel(z.re, z.im);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI);
        ctx.stroke();
    });

    // Draw Poles ('x')
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    const size = 6;
    poles.forEach(p => {
        const pt = complexToPixel(p.re, p.im);
        ctx.beginPath();
        ctx.moveTo(pt.x - size, pt.y - size);
        ctx.lineTo(pt.x + size, pt.y + size);
        ctx.moveTo(pt.x + size, pt.y - size);
        ctx.lineTo(pt.x - size, pt.y + size);
        ctx.stroke();
    });
}

function calculateAndPlot() {
    // Custom calculation or response plot updates go here
}

function clearAll() {
    poles = [];
    zeros = [];
    drawZPlane();
    calculateAndPlot();
}

// --- EVENT LISTENERS LOGIC ---
function setupCanvasListeners() {
    const findClosest = (pt) => {
        let match = null;
        let minD = 15; // Hit radius in pixels

        const checkList = (list, type) => {
            list.forEach((r, idx) => {
                const pPix = complexToPixel(r.re, r.im);
                const d = Math.hypot(pt.x - pPix.x, pt.y - pPix.y);
                if (d < minD) {
                    minD = d;
                    match = { list, index: idx, root: r, type };
                }
            });
        };

        checkList(poles, 'pole');
        checkList(zeros, 'zero');
        return match;
    };

    // MOUSE DOWN: Select, Delete, or Create Root
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mousePt = { 
            x: (e.clientX - rect.left) * (canvas.width / rect.width), 
            y: (e.clientY - rect.top) * (canvas.height / rect.height) 
        };
        const compCoord = pixelToComplex(mousePt.x, mousePt.y);
        const target = findClosest(mousePt);

        // 1. Delete Mode
        if (currentMode === 'delete') {
            if (target) {
                const item = target.root;
                target.list.splice(target.index, 1);

                if (document.getElementById('chkConjugate').checked && Math.abs(item.im) > 0.001) {
                    const cIdx = target.list.findIndex(r => 
                        Math.abs(r.re - item.re) < 0.01 && Math.abs(r.im + item.im) < 0.01
                    );
                    if (cIdx !== -1) target.list.splice(cIdx, 1);
                }
                drawZPlane();
                calculateAndPlot();
            }
            return;
        }

        // 2. Drag Mode
        if (target) {
            draggedRoot = target.root;

            if (document.getElementById('chkConjugate').checked && Math.abs(draggedRoot.im) > 0.001) {
                const sister = target.list.find(r => 
                    r !== draggedRoot && 
                    Math.abs(r.re - draggedRoot.re) < 0.05 && 
                    Math.sign(r.im) !== Math.sign(draggedRoot.im)
                );
                draggedRoot.sister = sister || null;
            } else {
                draggedRoot.sister = null;
            }
            return;
        }

        // 3. Add Root Mode
        if (currentMode === 'pole' || currentMode === 'zero') {
            const list = currentMode === 'pole' ? poles : zeros;
            const useConjugate = document.getElementById('chkConjugate').checked && Math.abs(compCoord.im) > 0.01;

            const newRoot = { re: compCoord.re, im: compCoord.im };
            list.push(newRoot);

            if (useConjugate) {
                const conjugateRoot = { re: compCoord.re, im: -compCoord.im };
                list.push(conjugateRoot);
            }

            drawZPlane();
            calculateAndPlot();
        }
    });

    // MOUSE MOVE: Update coordinates during dragging
    canvas.addEventListener('mousemove', (e) => {
        if (!draggedRoot) return;

        const rect = canvas.getBoundingClientRect();
        const mousePt = { 
            x: (e.clientX - rect.left) * (canvas.width / rect.width), 
            y: (e.clientY - rect.top) * (canvas.height / rect.height) 
        };
        const compCoord = pixelToComplex(mousePt.x, mousePt.y);

        draggedRoot.re = compCoord.re;
        draggedRoot.im = compCoord.im;

        if (draggedRoot.sister) {
            draggedRoot.sister.re = compCoord.re;
            draggedRoot.sister.im = -compCoord.im;
        }

        drawZPlane();
        calculateAndPlot();
    });

    // MOUSE UP: End drag action
    window.addEventListener('mouseup', () => { 
        if (draggedRoot) {
            delete draggedRoot.sister;
            draggedRoot = null; 
        }
    });
}

// --- INITIALIZE ON PAGE LOAD ---
window.onload = () => {
    setupCanvasListeners();
    drawZPlane();
};
