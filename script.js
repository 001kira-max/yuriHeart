const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const audio = document.getElementById("loveAudio");

let width;
let height;

let particles = [];
let frame = 0;
let animationStarted = false;

const WORDS = [
    "love you",
    "Love You",
    "LOVE YOU"
];

const COLORS = [
    [70, 130, 180],
    [30, 144, 255],
    [0, 191, 255],
    [100, 149, 237],
    [65, 105, 225]
];

const CENTER_TEXT = "Love You";


function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}


window.addEventListener("resize", resizeCanvas);

resizeCanvas();


/* --------------------------------
   ECUACIÓN DEL CORAZÓN
-------------------------------- */

function heartXY(t) {

    const x = 16 * Math.pow(Math.sin(t), 3);

    const y =
        13 * Math.cos(t)
        - 5 * Math.cos(2 * t)
        - 2 * Math.cos(3 * t)
        - Math.cos(4 * t);

    return {
        x: x,
        y: -y
    };
}


/* --------------------------------
   CONVERTIR A PANTALLA
-------------------------------- */

function toScreen(x, y) {

    const scale = Math.min(width, height) / 40;

    return {
        x: x * scale + width / 2,
        y: y * scale + height / 2
    };
}


/* --------------------------------
   PARTÍCULA
-------------------------------- */

class Particle {

    constructor(x, y, order, type) {

        this.x = x;
        this.y = y;

        this.order = order;
        this.type = type;

        this.word =
            WORDS[Math.floor(Math.random() * WORDS.length)];

        this.color =
            COLORS[Math.floor(Math.random() * COLORS.length)];

        this.alpha = 0;

        this.flicker =
            Math.random() * Math.PI * 2;

        this.sizeMultiplier =
            0.85 + Math.random() * 0.3;

        this.delay = 0;
    }
}


/* --------------------------------
   CREAR CONTORNO
-------------------------------- */

function buildOutlineParticles(count) {

    const result = [];

    const placed = [];

    const minGap = Math.min(width, height) * 0.018;

    for (let i = 0; i < count; i++) {

        const t =
            (i / count) * Math.PI * 2;

        const point =
            heartXY(t);

        const screen =
            toScreen(point.x, point.y);

        let tooClose = false;

        for (const p of placed) {

            const distance =
                Math.hypot(
                    screen.x - p.x,
                    screen.y - p.y
                );

            if (distance < minGap) {

                tooClose = true;
                break;
            }
        }

        if (!tooClose) {

            placed.push(screen);

            result.push(
                new Particle(
                    screen.x,
                    screen.y,
                    i,
                    "outline"
                )
            );
        }
    }

    return result;
}


/* --------------------------------
   CREAR INTERIOR
-------------------------------- */

function buildFillParticles(count) {

    const result = [];

    const placed = [];

    const minGap =
        Math.min(width, height) * 0.027;

    let attempts = 0;

    const maxAttempts =
        count * 80;

    while (
        result.length < count &&
        attempts < maxAttempts
    ) {

        attempts++;

        const t =
            Math.random() * Math.PI * 2;

        const r =
            Math.random() * 0.86;

        const point =
            heartXY(t);

        const x =
            point.x * r;

        const y =
            point.y * r;

        const screen =
            toScreen(x, y);

        let tooClose = false;

        for (const p of placed) {

            const distance =
                Math.hypot(
                    screen.x - p.x,
                    screen.y - p.y
                );

            if (distance < minGap) {

                tooClose = true;
                break;
            }
        }

        if (!tooClose) {

            placed.push(screen);

            result.push(
                new Particle(
                    screen.x,
                    screen.y,
                    Math.floor(Math.random() * 320),
                    "fill"
                )
            );
        }
    }

    return result;
}


/* --------------------------------
   TEXTO CON BRILLO
-------------------------------- */

function drawGlowText(
    particle,
    alpha
) {

    if (alpha <= 0) return;

    const fontSize =
        particle.type === "outline"
            ? 20
            : 17;

    const size =
        fontSize * particle.sizeMultiplier;

    const font =
        `bold ${size}px Arial`;

    const color =
        `rgb(
            ${particle.color[0]},
            ${particle.color[1]},
            ${particle.color[2]}
        )`;

    ctx.save();

    ctx.font = font;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.globalAlpha = alpha / 255;

    /*
       Brillo grande
    */

    ctx.shadowBlur = 18;

    ctx.shadowColor = color;

    ctx.fillStyle = color;

    ctx.fillText(
        particle.word,
        particle.x,
        particle.y
    );

    /*
       Texto más definido
    */

    ctx.shadowBlur = 7;

    ctx.fillText(
        particle.word,
        particle.x,
        particle.y
    );

    ctx.restore();
}


/* --------------------------------
   ANIMACIÓN
-------------------------------- */

function animate() {

    if (!animationStarted) return;

    frame++;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    /*
       Dibujar partículas
    */

    for (const particle of particles) {

        if (
            frame > particle.delay &&
            particle.alpha < 255
        ) {

            particle.alpha =
                Math.min(
                    255,
                    particle.alpha +
                    14 +
                    Math.floor(Math.random() * 5)
                );
        }

        let flicker = 1;

        if (particle.alpha >= 255) {

            flicker =
                0.75 +
                0.25 *
                Math.sin(
                    frame * 0.04 +
                    particle.flicker
                );
        }

        const alpha =
            particle.alpha * flicker;

        drawGlowText(
            particle,
            alpha
        );
    }


    /*
       TEXTO CENTRAL
    */

    const outlineSpan =
        Math.max(
            ...particles
                .filter(p => p.type === "outline")
                .map(p => p.order)
        );

    const framesPerStep = 1.6;

    const fillStartFrame =
        Math.floor(
            outlineSpan *
            framesPerStep
        ) + 30;

    const centerStart =
        fillStartFrame + 200;


    if (frame > centerStart) {

        const progress =
            Math.min(
                1,
                (frame - centerStart) / 60
            );

        const centerAlpha =
            255 *
            (1 - Math.exp(-progress * 8));

        const pulse =
            1 +
            0.025 *
            Math.sin(frame * 0.05);

        const fontSize =
            54 * pulse;

        ctx.save();

        ctx.font =
            `bold ${fontSize}px Georgia`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.globalAlpha =
            centerAlpha / 255;

        ctx.shadowBlur = 25;

        ctx.shadowColor =
            "rgba(180,220,255,0.8)";

        ctx.fillStyle =
            "rgb(255,250,245)";

        ctx.fillText(
            CENTER_TEXT,
            width / 2,
            height / 2
        );

        ctx.restore();
    }


    requestAnimationFrame(animate);
}


/* --------------------------------
   INICIAR
-------------------------------- */

startButton.addEventListener(
    "click",
    () => {

        startScreen.style.opacity = "0";

        setTimeout(() => {

            startScreen.style.display = "none";

        }, 1000);


        /*
           El navegador permite reproducir
           el audio porque hubo un clic.
        */

        audio.currentTime = 0;

        audio.play().catch(
            error => {
                console.log(
                    "No se pudo reproducir el audio:",
                    error
                );
            }
        );


        particles = [
            ...buildOutlineParticles(160),
            ...buildFillParticles(130)
        ];


        const outlineParticles =
            particles.filter(
                p => p.type === "outline"
            );

        const outlineSpan =
            Math.max(
                ...outlineParticles
                    .map(p => p.order)
            );

        const framesPerStep = 1.6;

        const fillStartFrame =
            Math.floor(
                outlineSpan *
                framesPerStep
            ) + 30;


        for (const p of particles) {

            if (p.type === "outline") {

                p.delay =
                    Math.floor(
                        p.order *
                        framesPerStep
                    );

            } else {

                p.delay =
                    fillStartFrame +
                    p.order;
            }
        }


        animationStarted = true;

        animate();
    }
);