let ambElapsed = 0;
let ambWind = 0.5;
let ambGust = -1;
let ambGustP = 1;
let ambDelayCahaya = 0;
let ambLeaves = [];
let ambStreaks = [];
let ambSpecks = [];
let ambSparks = [];
let ambClouds = [];
let ambDaunSprites = [];
let ambCloudSprite = null;

function ambKualitas() {
  return deviceTerpilih === "mobile" ? 0.55 : 1;
}

function ambBakeDaun(warna) {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 24;
  const g = c.getContext("2d");

  g.beginPath();
  g.moveTo(30, 1);
  g.quadraticCurveTo(3, 0, 1, 12);
  g.quadraticCurveTo(3, 24, 30, 23);
  g.quadraticCurveTo(23, 12, 30, 1);
  g.closePath();
  g.strokeStyle = "#000";
  g.lineWidth = 3;
  g.stroke();

  g.beginPath();
  g.moveTo(30, 3);
  g.quadraticCurveTo(5, 2, 3, 12);
  g.quadraticCurveTo(5, 22, 30, 21);
  g.quadraticCurveTo(22, 12, 30, 3);
  g.closePath();
  g.fillStyle = warna;
  g.fill();

  g.strokeStyle = "rgba(0,0,0,0.3)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(16, 5);
  g.lineTo(16, 19);
  g.stroke();
  return c;
}

function ambBakeAwan() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  r.addColorStop(0, "rgba(20, 35, 50, 0.35)");
  r.addColorStop(0.5, "rgba(20, 35, 50, 0.18)");
  r.addColorStop(1, "rgba(20, 35, 50, 0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  return c;
}

function ambBuat() {
  const q = ambKualitas();
  ambElapsed = 0;
  ambGust = Math.random() * 3;
  ambDelayCahaya = 0.3;

  ambDaunSprites = [
    ambBakeDaun("#6dbf4a"),
    ambBakeDaun("#4a9c2f"),
    ambBakeDaun("#8cd45e")
  ];
  ambCloudSprite = ambBakeAwan();
  ambLeaves = [];
  ambStreaks = [];
  ambSpecks = [];
  ambSparks = [];
  const nAwan = deviceTerpilih === "mobile" ? 1 : 2;
  const skrAwan = deviceTerpilih === "mobile" ? 0.55 : 1;
  ambClouds = [];
  for (let i = 0; i < nAwan; i++) {
    const r = (380 + Math.random() * 420) * skrAwan;
    ambClouds.push({
      x: kam.x + Math.random() * W,
      y: kam.y + Math.random() * H * 0.8,
      r: r,
      vx: (22 + Math.random() * 28) * (Math.random() < 0.5 ? 1 : -1),
      vy: (3 + Math.random() * 8) * (Math.random() < 0.5 ? 1 : -1)
    });
  }
  for (let i = 0; i < Math.round(10 * q); i++) ambLahirDaun();
  for (let i = 0; i < Math.round(8 * q); i++) ambLahirSpeck();
}

function ambLahirDaun() {
  ambLeaves.push({
    x: kam.x + Math.random() * W,
    y: kam.y - 30 - Math.random() * 50,
    s: 0.8 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() * 2 - 1) * 3,
    rot: Math.random() * Math.PI * 2,
    yoff: Math.random() * Math.PI * 2,
    ci: Math.floor(Math.random() * ambDaunSprites.length)
  });
}

function ambLahirSpeck() {
  ambSpecks.push({
    x: kam.x + Math.random() * W,
    y: kam.y + Math.random() * H,
    s: 2.5 + Math.random() * 2.5,
    phase: Math.random() * Math.PI * 2,
    life: 3 + Math.random() * 4,
    t: 0
  });
}

function ambLahirHembusan() {

  const n = 1 + Math.floor(Math.random() * 2);
  const x0 = kam.x + Math.random() * W;
  const y0 = kam.y + Math.random() * H;
  const sudut = (Math.random() - 0.5) * 0.6;
  for (let i = 0; i < n; i++) {
    ambStreaks.push({
      x: x0,
      y: y0 + (Math.random() - 0.5) * 40,
      len: 30 + Math.random() * 50,
      life: 0.5 + Math.random() * 0.3,
      t: 0,
      spd: (280 + Math.random() * 220) * (0.7 + ambWind * 0.7),
      sudut: sudut
    });
  }
}

function ambLahirCahaya() {
  ambSparks.push({
    x: kam.x + Math.random() * W,
    y: kam.y + Math.random() * H,
    life: 1.2 + Math.random() * 1,
    t: 0,
    s: 3 + Math.random() * 3
  });
}

function updateAmbience(dt) {
  ambElapsed += dt;
  ambWind = 0.5 + 0.45 * Math.sin(ambElapsed * 0.7);
  if (ambGust <= 0) {
    ambGust = 2 + Math.random() * 3.5;
    ambGustP = 1.5 + Math.random() * 1.8;
  }
  ambGust -= dt;
  const angin = ambWind * (ambGust > 0 ? ambGustP : 1);
  const q = ambKualitas();

  const nDaun = Math.round(10 * q);
  if (ambLeaves.length < nDaun) ambLahirDaun();
  const nSpeck = Math.round(8 * q);
  if (ambSpecks.length < nSpeck) ambLahirSpeck();

  if (ambStreaks.length === 0 && Math.random() < dt * (0.4 + angin * 0.5)) ambLahirHembusan();

  ambDelayCahaya -= dt;
  if (ambDelayCahaya <= 0 && ambSparks.length < Math.round(10 * q)) {
    ambLahirCahaya();
    ambDelayCahaya = 0.8 + Math.random() * 1.2;
  }

  for (let i = ambLeaves.length - 1; i >= 0; i--) {
    const d = ambLeaves[i];
    d.phase += d.spin * dt;
    d.x += (angin * 90 + Math.sin(d.phase) * 36) * dt;
    d.y += (28 + 24 * Math.sin(d.phase * 0.9 + d.yoff)) * dt;
    d.rot += d.spin * 0.7 * dt;
    if (d.y > kam.y + H + 50) { ambLeaves.splice(i, 1); ambLahirDaun(); }
  }

  for (let i = ambStreaks.length - 1; i >= 0; i--) {
    const s = ambStreaks[i];
    s.t += dt;
    s.x += s.spd * dt;
    if (s.t >= s.life || s.x > kam.x + W + 100) ambStreaks.splice(i, 1);
  }

  for (let i = ambSpecks.length - 1; i >= 0; i--) {
    const p = ambSpecks[i];
    p.t += dt;
    p.phase += dt * 1.8;
    p.x += (angin * 20 + Math.sin(p.phase) * 10) * dt;
    p.y += Math.cos(p.phase * 0.7) * 8 * dt;
    if (p.x > kam.x + W + 50 || p.y > kam.y + H + 50 || p.x < kam.x - 50 || p.t >= p.life) {
      ambSpecks.splice(i, 1);
      ambLahirSpeck();
    }
  }

  for (let i = ambSparks.length - 1; i >= 0; i--) {
    ambSparks[i].t += dt;
    if (ambSparks[i].t >= ambSparks[i].life) ambSparks.splice(i, 1);
  }

  for (let i = 0; i < ambClouds.length; i++) {
    const a = ambClouds[i];
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.x > kam.x + W + a.r) a.x = kam.x - a.r - 60;
    if (a.x < kam.x - a.r * 2 - 60) a.x = kam.x + W + a.r;
    if (a.y > kam.y + H + a.r) a.y = kam.y - a.r * 0.5;
    if (a.y < kam.y - a.r * 1.5) a.y = kam.y + H * 0.5;
  }
}

function gambarAmbience() {
  if (!(statusGame === "main" || statusGame === "upgrade" ||
    statusGame === "pause" || statusGame === "over")) return;

  if (ambCloudSprite) {
    for (const a of ambClouds) {
      ctx.globalAlpha = 1;
      ctx.drawImage(ambCloudSprite, a.x - a.r, a.y - a.r * 0.7, a.r * 2, a.r * 1.4);
    }
    ctx.globalAlpha = 1;
  }

  for (const s of ambStreaks) {
    const k = Math.sin(Math.min(1, s.t / s.life) * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255," + (0.35 * k).toFixed(3) + ")";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.len * Math.cos(s.sudut), s.y - s.len * Math.sin(s.sudut));
    ctx.stroke();
  }

  for (const p of ambSpecks) {
    const a = Math.min(1, p.t / 0.3) * Math.min(1, (p.life - p.t) / 0.5);
    ctx.fillStyle = "rgba(255,250,210," + (0.8 * a).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const d of ambLeaves) {
    const sk = d.s / 4;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.drawImage(ambDaunSprites[d.ci], -16 * sk, -12 * sk, 32 * sk, 24 * sk);
    ctx.restore();
  }

  for (const c of ambSparks) {
    const k = Math.sin(Math.PI * Math.min(1, c.t / c.life));
    ctx.fillStyle = "rgba(255,255,230," + (0.9 * k).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.s, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,240," + (0.5 * k).toFixed(3) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.x - c.s * 2, c.y);
    ctx.lineTo(c.x + c.s * 2, c.y);
    ctx.moveTo(c.x, c.y - c.s * 2);
    ctx.lineTo(c.x, c.y + c.s * 2);
    ctx.stroke();
  }
}
