/* ========================================================
   UI i Interfície
   ======================================================== */

// Objecte per guardar elements de la UI
const ui = { presentacio: null, inici: null, estat: null };

// Funcions helpers per mostrar/ocultar elements i actualitzar estats
const mostrar   = (el) => (el.style.display = "flex");      
const ocultar   = (el) => (el.style.display = "none");      
const carregant = (el) => (el.innerHTML = "Carregant..");   
const iniciant  = (el) => (el.innerHTML = "Iniciant càmera..");

/* ========================================================
   Pantalla de càrrega i recursos
   ======================================================== */
let iniciClick = false;   // Indica si s'ha premut el botó d'inici
let pumpkin     = null;   // Imatge de la carbassa
let fantasma    = null;   // Imatge del fantasma

/* ========================================================
   FaceMesh
   ======================================================== */
let faceMesh;
let options = { maxFaces: 1, refineLandmarks: false, flipped: false };
let video;
let faces = [];

/* ========================================================
   Animacions
   ======================================================== */
let fantasmas = [];   // Array de fantasmes animats

/* ========================================================
   Música i controls
   ======================================================== */
let music        = null;  // Música de fons
let controls     = null;  // Contenidor de controls
let boton        = null;  // Botó play/pause
let volumenSlider= null;  // Slider de volum

/* ========================================================
   Partícules (carmels)
   ======================================================== */
let candies    = [];   // Array de caramels
let emitTimer  = 0;    // Temporitzador per emetre partícules

/* ========================================================
   Setup principal
   ======================================================== */
async function setup() {
  createCanvas(1920, 1080);
  clear(); 
  
  // Assignar elements UI
  ui.presentacio = document.getElementById("presentacio");
  ui.inici       = document.getElementById("inici");
  ui.estat       = document.getElementById("estat"); 
  
  ocultar(ui.presentacio);
  carregant(ui.estat);
  mostrar(ui.estat);
  
  // Carrega recursos visuals i de so
  pumpkin = await loadImage("./images/pumpkin.png");
  fantasma = await loadImage("./images/fantasma.png");
  music = await createAudio("./sounds/music.ogg");
  music.hideControls();

  // Inicialitza model FaceMesh
  faceMesh = await ml5.faceMesh(options); 

  // Crea fantasmes amb posicions inicials aleatòries
  for (let i = 0; i < 10; i++) {
    fantasmas.push({
      xOff: random(1000),   
      yOff: random(2000),   
      size: random(30, 70)  
    });
  }  
  
  music.loop();
 
  // Crear controls de música
  controls = document.getElementById("controls"); 
  boton = createButton("⏸️");
  boton.parent(controls);
  boton.mousePressed(iniciarMusica);
  boton.addClass("button-musica");
    
  volumenSlider = createSlider(0, 1, 0.05, 0.01);
  volumenSlider.parent(controls);
  volumenSlider.addClass("slider-volumn");

  // Mostra UI d’inici
  mostrar(ui.presentacio); 
  ocultar(ui.estat);

  // Assignar event listener del botó
  ui.inici.addEventListener("click", startCamera);
}

/* ========================================================
   Inici de la càmera
   ======================================================== */
async function startCamera() {
  if (iniciClick) return;
  iniciClick = true;

  ocultar(ui.presentacio);
  iniciant(ui.estat);
  mostrar(ui.estat);

  // Captura vídeo i l'amaga
  video = createCapture(VIDEO);
  video.size(1920, 1080);
  video.hide();

  // Comença detecció de cares quan el vídeo està llest
  video.elt.onloadeddata = () => {
    faceMesh.detectStart(video, gotFaces);
    ocultar(ui.estat);
  };
}

/* ========================================================
   Callback de detecció de cares
   ======================================================== */
function gotFaces(results) {
  faces = results;
}

/* ========================================================
   Draw principal
   ======================================================== */
function draw() {
  clear(); 
  noStroke();
  
  if (!iniciClick) animacioPresentacio();

  if (video && video.elt.readyState >= 2) {
    push();
    imageMode(CENTER);
    image(video, width/2, height/2, width, height);
    pop();

    // Escalar coordenades per FaceMesh
    const scaleX = width / video.width;
    const scaleY = height / video.height;
    const offsetX = width / 2 - (video.width * scaleX)/2;
    const offsetY = height / 2 - (video.height * scaleY)/2;
    
    if (faces.length > 0 && faces[0].lips) {
      const lips = faces[0].lips;
      const lipsScaled = {
        x: offsetX + lips.x * scaleX,
        y: offsetY + lips.y * scaleY,
        width: lips.width * scaleX,
        height: lips.height * scaleY
      };
      emitParticlesFromLips(lips, lipsScaled);
    }
  }

  // Control de volum
  if (music) music.volume(volumenSlider.value());

  // Actualitza i dibuixa caramels
  for (let i = candies.length - 1; i >= 0; i--) {
    let c = candies[i];
    c.update();
    c.show();
    if (c.finished()) candies.splice(i, 1);
  }
}

/* ========================================================
   Animació de presentació (fantasmes + carbassa)
   ======================================================== */
function animacioPresentacio() {
  imageMode(CENTER);
  tint(255, 15); // Fantasmes semi-transparents

  for (let i = 0; i < fantasmas.length; i++) {
    let f = fantasmas[i];
    let x = noise(f.xOff) * width;
    let y = noise(f.yOff) * height;
    image(fantasma, x, y, f.size, f.size);
    f.xOff += 0.0006 + i*0.0001;
    f.yOff += 0.0007 + i*0.00008;
  }
  noTint();
  
  // Animació carbassa "respira"
  push();
  if (!pumpkin) return;

  const rect = ui.inici.getBoundingClientRect();
  const x = rect.left + rect.width/2;
  const y = rect.top - 60;

  translate(x, y);
  const scaleFactor = 1 + 0.04*sin(frameCount*0.02);
  scale(scaleFactor);
  image(pumpkin, 0, 0, 100, 100);
  pop();
}

/* ========================================================
   Control música
   ======================================================== */
function iniciarMusica() {
  if (!music) return;
  if (!music.elt.paused) {
    music.pause();
    boton.html("▶️");
  } else {
    music.play();
    boton.html("⏸️");
  }
}

/* ========================================================
   Emissió de partícules des dels llavis
   ======================================================== */
function emitParticlesFromLips(lipsOriginal, lipsScaled) {
  const d = mouthOpenness();
  const open = d > 80; // Obertura mínima

  if (open && frameCount - emitTimer > 5) {
    emitTimer = frameCount;

    let numCandies = floor(random(1,3));
    let margin = 60;

    for (let i = 0; i < numCandies; i++) {
      let side = floor(random(4));
      let px, py, vx, vy;

      if (side === 0) {
        px = lipsScaled.x - margin;
        py = random(lipsScaled.y - margin, lipsScaled.y + lipsScaled.height + margin);
        vx = random(-1.2,-0.8); vy = random(-0.3,0.3);
      } else if (side === 1) {
        px = lipsScaled.x + lipsScaled.width + margin;
        py = random(lipsScaled.y - margin, lipsScaled.y + lipsScaled.height + margin);
        vx = random(0.8,1.2); vy = random(-0.3,0.3);
      } else if (side === 2) {
        px = random(lipsScaled.x - margin, lipsScaled.x + lipsScaled.width + margin);
        py = lipsScaled.y - margin; vx = random(-0.3,0.3); vy = random(-1.2,-0.8);
      } else {
        px = random(lipsScaled.x - margin, lipsScaled.x + lipsScaled.width + margin);
        py = lipsScaled.y + lipsScaled.height + margin; vx = random(-0.3,0.3); vy = random(0.8,1.2);
      }

      candies.push(new Candy(px, py, vx, vy));
    }
  }
}

/* ========================================================
   Control obertura de la boca
   ======================================================== */
function mouthOpenness() {
  if (!faces.length || !faces[0].lips?.keypoints?.length) return 0;
  const kp = faces[0].lips.keypoints;
  const upper = kp[Math.floor(kp.length/2)-4];
  const lower = kp[Math.floor(kp.length/2)+4];
  if (!upper || !lower) return 0;
  return dist(upper.x, upper.y, lower.x, lower.y);
}

