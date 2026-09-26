const MAP_ASSET = {
  kunci: "padang",
  nama: "Padang Terbuka",
  gambar: "assets/maps/padang.png",
  warnaTanah: "#7ec850"
};

let petaImage = null;
let petaSiap = false;
let petaBlok = [];
let petaKolom = 0;
let petaBaris = 0;
let petaGagal = false;
let pesanPeta = "";

let petaSelX = WORLD_W;
let petaSelY = WORLD_H;

const BARRIER_KIRI = 270;
const BARRIER_KANAN = 260;
const BARRIER_ATAS = 160;
const BARRIER_BAWAH = 170;

function muatPeta() {
  const img = new Image();
  img.onload = () => {
    petaKolom = img.naturalWidth;
    petaBaris = img.naturalHeight;
    petaSelX = WORLD_W / petaKolom;
    petaSelY = WORLD_H / petaBaris;

    petaImage = img;
    if (typeof latarDirty === "boolean") latarDirty = true;
    const tc = document.createElement("canvas");
    tc.width = petaKolom;
    tc.height = petaBaris;
    const tg = tc.getContext("2d");
    tg.drawImage(img, 0, 0);
    let d;
    try {
      d = tg.getImageData(0, 0, petaKolom, petaBaris).data;
    } catch (e) {

      if (typeof GRID_PETA_B64 === "string") {
        petaBlok = bacaGridB64(GRID_PETA_B64, petaKolom * petaBaris);
        console.warn("MAP: pixel PNG tidak terbaca (kemungkinan dibuka via file://)." +
          " Dinding memakai grid terbenam.");
      } else {
        petaBlok = new Array(petaKolom * petaBaris).fill(false);
        console.warn("MAP: pixel PNG tidak terbaca (kemungkinan dibuka via file://)." +
          " Dinding nonaktif; tepi map tetap dibatasi. Regenerasi grid:" +
          " powershell -File tools\\generate-map-grid.ps1.");
      }
      petaSiap = true;
      return;
    }
    petaBlok = [];
    for (let y = 0; y < petaBaris; y++) {
      for (let x = 0; x < petaKolom; x++) {
        const i = (y * petaKolom + x) * 4;

        petaBlok.push(d[i + 3] === 255 && d[i] === 0 && d[i + 1] === 0 && d[i + 2] === 0);
      }
    }
    petaSiap = true;
  };
  img.onerror = () => {
    petaSiap = false;
    petaImage = null;
    petaGagal = true;
    console.warn("MAP GAGAL DIMUAT: " + MAP_ASSET.gambar +
      " tidak ditemukan. Pastikan file ada di assets/maps/.");
  };
  img.src = MAP_ASSET.gambar;
}

function bacaGridB64(b64, panjang) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const blok = new Array(panjang);
  for (let i = 0; i < panjang; i++) {
    blok[i] = (arr[i >> 3] & (1 << (i & 7))) !== 0;
  }
  return blok;
}

muatPeta();

function tesBlokTile(x, y) {
  if (!petaSiap) return false;
  if (x < 0 || y < 0 || x >= petaKolom || y >= petaBaris) return true;

  const wx = x * petaSelX, wy = y * petaSelY;
  if (wx < BARRIER_KIRI || wy < BARRIER_ATAS || wx > WORLD_W - BARRIER_KANAN || wy > WORLD_H - BARRIER_BAWAH) return true;
  return petaBlok[y * petaKolom + x];
}

function tesLingkaran(x, y, r) {
  const t0x = Math.floor((x - r) / petaSelX);
  const t1x = Math.floor((x + r) / petaSelX);
  const t0y = Math.floor((y - r) / petaSelY);
  const t1y = Math.floor((y + r) / petaSelY);
  for (let ty = t0y; ty <= t1y; ty++) {
    for (let tx = t0x; tx <= t1x; tx++) {
      if (tesBlokTile(tx, ty)) {
        const bx = tx * petaSelX, by = ty * petaSelY;
        const cx2 = Math.max(bx, Math.min(x, bx + petaSelX));
        const cy2 = Math.max(by, Math.min(y, by + petaSelY));
        const dx = cx2 - x, dy = cy2 - y;
        if (dx * dx + dy * dy < r * r) return true;
      }
    }
  }
  return false;
}
