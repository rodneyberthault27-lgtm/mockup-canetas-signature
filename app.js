const canvas = document.querySelector("#mockupCanvas");
const ctx = canvas.getContext("2d");
const emptyState = document.querySelector("#emptyState");
const downloadBtn = document.querySelector("#downloadBtn");
const logoUpload = document.querySelector("#logoUpload");
const penUpload = document.querySelector("#penUpload");
const penRotationControl = document.querySelector("#penRotationControl");
const maskControl = document.querySelector("#maskControl");
const scaleControl = document.querySelector("#scaleControl");
const rotationControl = document.querySelector("#rotationControl");
const opacityControl = document.querySelector("#opacityControl");
const logoCutoutControl = document.querySelector("#logoCutoutControl");
const logoColorMode = document.querySelector("#logoColorMode");
const logoColorInput = document.querySelector("#logoColorInput");
const logoColorRow = document.querySelector(".color-row");
const blendControl = document.querySelector("#blendControl");
const penRotationValue = document.querySelector("#penRotationValue");
const maskValue = document.querySelector("#maskValue");
const scaleValue = document.querySelector("#scaleValue");
const rotationValue = document.querySelector("#rotationValue");
const opacityValue = document.querySelector("#opacityValue");
const logoCutoutValue = document.querySelector("#logoCutoutValue");
const blendValue = document.querySelector("#blendValue");
const centerLogoBtn = document.querySelector("#centerLogoBtn");
const resetLogoBtn = document.querySelector("#resetLogoBtn");
const saveProfileBtn = document.querySelector("#saveProfileBtn");
const resetProfileBtn = document.querySelector("#resetProfileBtn");
const exportFormat = document.querySelector("#exportFormat");
const batchDownloadBtn = document.querySelector("#batchDownloadBtn");
const penGrid = document.querySelector("#penGrid");
const productSearch = document.querySelector("#productSearch");
const categoryFilter = document.querySelector("#categoryFilter");
const productCount = document.querySelector("#productCount");
const fitButtons = document.querySelectorAll("[data-fit]");
const productColorButtons = document.querySelectorAll("[data-product-color]");
const modeButtons = document.querySelectorAll("[data-mode]");
const presetButtons = document.querySelectorAll("[data-preset]");
const nudgeButtons = document.querySelectorAll("[data-nudge]");
const brandImage = new Image();
brandImage.src = "./assets/newpen-signature.png";

const PROFILE_STORAGE_KEY = "newpen-signature-product-profiles";
const EXPORT_FORMATS = {
  standard: { width: 1600, height: 1280, label: "alta-resolucao" },
  whatsapp: { width: 1200, height: 1200, label: "whatsapp" },
  "instagram-post": { width: 1080, height: 1080, label: "instagram-post" },
  "instagram-story": { width: 1080, height: 1920, label: "instagram-story" },
};

const state = {
  pen: new Image(),
  logo: null,
  logoOriginal: null,
  products: [],
  selectedProduct: null,
  productColor: "all",
  fit: "contain",
  penRotation: Number(penRotationControl.value),
  maskTolerance: Number(maskControl.value),
  logoX: canvas.width * 0.5,
  logoY: canvas.height * 0.52,
  scale: Number(scaleControl.value) / 100,
  rotation: Number(rotationControl.value),
  opacity: Number(opacityControl.value) / 100,
  logoCutout: Number(logoCutoutControl.value),
  logoColorMode: logoColorMode.value,
  logoColor: logoColorInput.value,
  blend: Number(blendControl.value) / 100,
  isDragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
};

document.body.classList.add("simple-mode");
state.pen.crossOrigin = "anonymous";
loadProducts();

async function loadProducts() {
  try {
    const response = await fetch("./products.json");
    if (!response.ok) throw new Error("Nao foi possivel carregar products.json");
    state.products = await response.json();
    renderCategoryOptions();
    renderProducts();
    if (state.products[0]) selectProduct(state.products[0]);
  } catch (error) {
    productCount.textContent = "Nao foi possivel carregar a galeria.";
    penGrid.innerHTML = '<p class="hint">Abra pelo servidor local ou publique no GitHub Pages para carregar o catalogo.</p>';
    console.error(error);
  }
}

function loadPen(src) {
  const image = new Image();
  image.crossOrigin = src.startsWith("data:") || src.startsWith("blob:") ? "" : "anonymous";
  image.onload = () => {
    state.pen = image;
    draw();
  };
  image.src = src;
}

function loadLogo(src) {
  const image = new Image();
  image.onload = () => {
    state.logoOriginal = image;
    state.logo = processLogoImage(image);
    state.logoX = canvas.width * 0.5;
    state.logoY = canvas.height * 0.52;
    emptyState.classList.add("is-hidden");
    draw();
  };
  image.src = src;
}

function processLogoImage(image) {
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = image.width;
  logoCanvas.height = image.height;
  const logoCtx = logoCanvas.getContext("2d");
  logoCtx.drawImage(image, 0, 0);

  if (state.logoCutout > 0) {
    const imageData = logoCtx.getImageData(0, 0, logoCanvas.width, logoCanvas.height);
    const data = imageData.data;
    const tolerance = state.logoCutout;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      const nearWhite = red > 255 - tolerance && green > 255 - tolerance && blue > 255 - tolerance;
      if (alpha > 0 && nearWhite) data[index + 3] = 0;
    }

    logoCtx.putImageData(imageData, 0, 0);
  }

  return logoCanvas;
}

function renderCategoryOptions() {
  const categories = [...new Set(state.products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  categoryFilter.innerHTML = '<option value="all">Todas as linhas</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function renderProducts() {
  const filtered = getFilteredProducts();

  productCount.textContent = `${filtered.length} produto${filtered.length === 1 ? "" : "s"}`;
  penGrid.innerHTML = "";

  if (!filtered.length) {
    penGrid.innerHTML = '<p class="hint">Nenhum produto encontrado.</p>';
    return;
  }

  filtered.forEach((product) => {
    const button = document.createElement("button");
    button.className = `pen-option${state.selectedProduct?.src === product.src ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.src = product.src;
    button.innerHTML = `
      <img src="${product.src}" alt="${product.category} ${product.name}" loading="lazy" />
      <span>${product.category}<br>${product.name}</span>
    `;
    penGrid.appendChild(button);
  });
}

function getFilteredProducts() {
  const term = normalizeText(productSearch.value);
  const category = categoryFilter.value;
  return state.products.filter((product) => {
    const productText = normalizeText(`${product.category} ${product.name}`);
    const matchesCategory = category === "all" || product.category === category;
    const matchesTerm = !term || productText.includes(term);
    const matchesColor = state.productColor === "all" || matchesProductColor(productText, state.productColor);
    return matchesCategory && matchesTerm && matchesColor;
  });
}

function matchesProductColor(productText, color) {
  const colorTerms = {
    preta: ["preta", "preto", "black", "all black"],
    branca: ["branca", "branco", "white"],
    azul: ["azul", "blue"],
    vermelha: ["vermelha", "vermelho", "red"],
    verde: ["verde", "green"],
    amarela: ["amarela", "amarelo", "yellow"],
    rosa: ["rosa", "rose", "pink"],
    roxo: ["roxo", "roxa", "lilas", "purple"],
    laranja: ["laranja", "orange"],
    dourada: ["dourada", "dourado", "gold"],
    prata: ["prata", "silver"],
  };

  return (colorTerms[color] || [color]).some((term) => productText.includes(term));
}

function selectProduct(product) {
  state.selectedProduct = product;
  loadPen(product.src);
  applyProductProfile(product);
  renderProducts();
}

function applyProductProfile(product) {
  const profile = getSavedProfiles()[product.src] || getDefaultProfile(product);
  state.logoX = canvas.width * profile.logoX;
  state.logoY = canvas.height * profile.logoY;
  state.scale = profile.scale;
  state.rotation = profile.rotation;
  state.blend = profile.blend;
  state.maskTolerance = profile.maskTolerance;
  syncControlsFromState();
}

function getDefaultProfile(product) {
  const category = normalizeText(product?.category || "");
  const base = { logoX: 0.5, logoY: 0.52, scale: 0.26, rotation: -9, blend: 0.34, maskTolerance: 24 };

  if (category.includes("lapis")) return { ...base, logoY: 0.5, scale: 0.22, rotation: -7, blend: 0.28 };
  if (category.includes("marcador")) return { ...base, logoY: 0.5, scale: 0.3, rotation: -5, blend: 0.22, maskTolerance: 18 };
  if (category.includes("estojo") || category.includes("porta")) return { ...base, logoY: 0.5, scale: 0.34, rotation: 0, blend: 0.12 };
  if (category.includes("regua")) return { ...base, logoY: 0.49, scale: 0.28, rotation: 0, blend: 0.1 };
  if (category.includes("bambu")) return { ...base, logoY: 0.52, scale: 0.24, rotation: -6, blend: 0.2, maskTolerance: 16 };
  return base;
}

function getSavedProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCurrentProfile() {
  if (!state.selectedProduct) return;
  const profiles = getSavedProfiles();
  profiles[state.selectedProduct.src] = {
    logoX: state.logoX / canvas.width,
    logoY: state.logoY / canvas.height,
    scale: state.scale,
    rotation: state.rotation,
    blend: state.blend,
    maskTolerance: state.maskTolerance,
  };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function syncControlsFromState() {
  penRotationControl.value = state.penRotation;
  maskControl.value = state.maskTolerance;
  scaleControl.value = Math.round(state.scale * 100);
  rotationControl.value = state.rotation;
  opacityControl.value = Math.round(state.opacity * 100);
  logoCutoutControl.value = state.logoCutout;
  blendControl.value = Math.round(state.blend * 100);
  logoColorMode.value = state.logoColorMode;
  logoColorInput.value = state.logoColor;
  logoColorRow.classList.toggle("is-visible", state.logoColorMode === "custom");
  updateValueLabels();
}

function updateValueLabels() {
  penRotationValue.textContent = `${Math.round(state.penRotation)}°`;
  maskValue.textContent = `${Math.round(state.maskTolerance)}`;
  scaleValue.textContent = `${Math.round(state.scale * 100)}%`;
  rotationValue.textContent = `${Math.round(state.rotation)}°`;
  opacityValue.textContent = `${Math.round(state.opacity * 100)}%`;
  logoCutoutValue.textContent = `${Math.round(state.logoCutout)}`;
  blendValue.textContent = `${Math.round(state.blend * 100)}`;
}

function centerLogo() {
  const profile = state.selectedProduct ? getSavedProfiles()[state.selectedProduct.src] || getDefaultProfile(state.selectedProduct) : null;
  state.logoX = canvas.width * (profile?.logoX || 0.5);
  state.logoY = canvas.height * (profile?.logoY || 0.52);
  draw();
}

function resetLogoAdjustments() {
  const profile = state.selectedProduct ? getDefaultProfile(state.selectedProduct) : getDefaultProfile(null);
  state.logoX = canvas.width * profile.logoX;
  state.logoY = canvas.height * profile.logoY;
  state.scale = profile.scale;
  state.rotation = profile.rotation;
  state.blend = profile.blend;
  state.maskTolerance = profile.maskTolerance;
  state.opacity = 0.92;
  state.logoCutout = 24;
  state.logoColorMode = "original";
  syncControlsFromState();
  if (state.logoOriginal) state.logo = processLogoImage(state.logoOriginal);
  draw();
}

function applyPreset(preset) {
  const presets = {
    subtle: { scale: 0.22, opacity: 0.72, blend: 0.48, colorMode: "original", rotation: state.rotation },
    white: { scale: 0.26, opacity: 0.95, blend: 0.3, colorMode: "#ffffff", rotation: state.rotation },
    black: { scale: 0.26, opacity: 0.9, blend: 0.34, colorMode: "#111111", rotation: state.rotation },
    gold: { scale: 0.25, opacity: 0.88, blend: 0.38, colorMode: "#c79a2b", rotation: state.rotation },
  };
  const next = presets[preset];
  if (!next) return;
  state.scale = next.scale;
  state.opacity = next.opacity;
  state.blend = next.blend;
  state.logoColorMode = next.colorMode;
  state.rotation = next.rotation;
  syncControlsFromState();
  draw();
}

function draw() {
  renderScene(ctx, true);
}

function renderScene(targetCtx, includeSelection) {
  targetCtx.clearRect(0, 0, canvas.width, canvas.height);
  targetCtx.fillStyle = "#ffffff";
  targetCtx.fillRect(0, 0, canvas.width, canvas.height);

  const single = getViewFrame("single");
  drawPen(targetCtx, single);

  if (!state.logo) return;

  const logoWidth = Math.max(60, canvas.width * state.scale);
  const logoHeight = logoWidth * (state.logo.height / state.logo.width);
  drawLogoClippedToPen(targetCtx, logoWidth, logoHeight, single, state.logoX, state.logoY);
  if (includeSelection) drawSelection(targetCtx, logoWidth, logoHeight, state.logoX, state.logoY);
}

function getViewFrame(side) {
  return { centerX: canvas.width / 2, centerY: canvas.height / 2, width: canvas.width, height: canvas.height };
}

function drawPen(targetCtx, frame) {
  if (!state.pen.complete || state.pen.naturalWidth === 0) return;

  const size = getFitSize(state.pen, state.fit, frame.width, frame.height);
  const angle = (state.penRotation * Math.PI) / 180;
  const rotatedWidth = Math.abs(size.width * Math.cos(angle)) + Math.abs(size.height * Math.sin(angle));
  const rotatedHeight = Math.abs(size.width * Math.sin(angle)) + Math.abs(size.height * Math.cos(angle));
  const rotationScale =
    state.fit === "contain" ? Math.min(1, frame.width / rotatedWidth, frame.height / rotatedHeight) : 1;

  targetCtx.save();
  targetCtx.translate(frame.centerX, frame.centerY);
  targetCtx.rotate(angle);
  targetCtx.drawImage(
    state.pen,
    (-size.width * rotationScale) / 2,
    (-size.height * rotationScale) / 2,
    size.width * rotationScale,
    size.height * rotationScale,
  );
  targetCtx.restore();
}

function getFitSize(image, mode, targetWidth = canvas.width, targetHeight = canvas.height) {
  if (!image.complete || image.naturalWidth === 0) return { width: 0, height: 0 };

  const canvasRatio = targetWidth / targetHeight;
  const imageRatio = image.width / image.height;

  if ((mode === "cover" && imageRatio > canvasRatio) || (mode === "contain" && imageRatio < canvasRatio)) {
    const height = targetHeight;
    return { width: height * imageRatio, height };
  }

  const width = targetWidth;
  return { width, height: width / imageRatio };
}

function drawLogoClippedToPen(targetCtx, width, height, frame, logoX, logoY, wrapOffset = 0) {
  const logoLayer = document.createElement("canvas");
  logoLayer.width = canvas.width;
  logoLayer.height = canvas.height;
  const logoCtx = logoLayer.getContext("2d");

  drawEngravedLogo(logoCtx, width, height, logoX + wrapOffset, logoY);

  logoCtx.save();
  logoCtx.globalCompositeOperation = "destination-in";
  logoCtx.drawImage(createPenMask(frame), 0, 0);
  logoCtx.restore();

  targetCtx.drawImage(logoLayer, 0, 0);
}

function drawEngravedLogo(targetCtx, width, height, logoX, logoY) {
  const bend = state.blend;
  const temp = document.createElement("canvas");
  const tempCtx = temp.getContext("2d");
  const padding = Math.ceil(height * 0.45);
  temp.width = Math.ceil(width);
  temp.height = Math.ceil(height + padding * 2);

  tempCtx.clearRect(0, 0, temp.width, temp.height);
  tempCtx.drawImage(state.logo, 0, padding, width, height);
  applyLogoColor(tempCtx, temp.width, temp.height);

  targetCtx.save();
  targetCtx.translate(logoX, logoY);
  targetCtx.rotate(((state.rotation + state.penRotation) * Math.PI) / 180);
  targetCtx.globalAlpha = state.opacity;
  targetCtx.globalCompositeOperation = "multiply";
  targetCtx.filter = `contrast(${1 + bend * 0.55}) saturate(${1 - bend * 0.42}) brightness(${1 - bend * 0.12})`;
  targetCtx.shadowColor = "rgba(0, 0, 0, 0.26)";
  targetCtx.shadowBlur = 1.4 + bend * 2;
  targetCtx.shadowOffsetX = 0.8;
  targetCtx.shadowOffsetY = 1.2;

  const columns = Math.max(80, Math.ceil(width));
  const sliceWidth = temp.width / columns;
  for (let index = 0; index < columns; index += 1) {
    const progress = index / (columns - 1 || 1);
    const centered = progress * 2 - 1;
    const curve = Math.sqrt(Math.max(0, 1 - centered * centered));
    const wrapScale = 1 - bend * 0.34 * Math.abs(centered);
    const yOffset = bend * height * 0.16 * (1 - curve);
    const destHeight = temp.height * wrapScale;
    const x = -width / 2 + index * (width / columns);

    targetCtx.drawImage(
      temp,
      index * sliceWidth,
      0,
      sliceWidth + 1,
      temp.height,
      x,
      -destHeight / 2 + yOffset,
      width / columns + 1,
      destHeight,
    );
  }

  targetCtx.restore();

  targetCtx.save();
  targetCtx.translate(logoX, logoY);
  targetCtx.rotate(((state.rotation + state.penRotation) * Math.PI) / 180);
  targetCtx.globalAlpha = Math.min(0.18, state.opacity * 0.22);
  targetCtx.globalCompositeOperation = "multiply";
  targetCtx.fillStyle = "rgba(0,0,0,0.35)";
  targetCtx.fillRect(-width / 2, height * 0.44, width, 1.6 + bend * 2);
  targetCtx.restore();

  targetCtx.save();
  targetCtx.translate(logoX, logoY);
  targetCtx.rotate(((state.rotation + state.penRotation) * Math.PI) / 180);
  targetCtx.globalAlpha = Math.min(0.28, state.opacity * 0.32);
  targetCtx.globalCompositeOperation = "screen";
  const shine = targetCtx.createLinearGradient(-width / 2, 0, width / 2, 0);
  shine.addColorStop(0, "rgba(255,255,255,0)");
  shine.addColorStop(0.45, "rgba(255,255,255,0.42)");
  shine.addColorStop(0.58, "rgba(255,255,255,0.08)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  targetCtx.fillStyle = shine;
  targetCtx.fillRect(-width / 2, -height * 0.65, width, height * 1.3);
  targetCtx.restore();
}

function applyLogoColor(targetCtx, width, height) {
  const color = getLogoColor();
  if (!color) return;

  targetCtx.save();
  targetCtx.globalCompositeOperation = "source-in";
  targetCtx.fillStyle = color;
  targetCtx.fillRect(0, 0, width, height);
  targetCtx.restore();
}

function getLogoColor() {
  if (state.logoColorMode === "original") return null;
  if (state.logoColorMode === "custom") return state.logoColor;
  return state.logoColorMode;
}

function createPenMask(frame) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext("2d");

  drawPen(maskCtx, frame);

  const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const data = imageData.data;
  const tolerance = state.maskTolerance;
  let transparentPixels = 0;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 20) transparentPixels += 1;
  }

  const hasTransparentBackground = transparentPixels > data.length / 4 * 0.08;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const nearWhite = red > 255 - tolerance && green > 255 - tolerance && blue > 255 - tolerance;
    const visible = hasTransparentBackground ? alpha > 20 : alpha > 20 && !nearWhite;

    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = visible ? 255 : 0;
  }

  maskCtx.putImageData(imageData, 0, 0);
  return maskCanvas;
}

function drawSelection(targetCtx, width, height, logoX, logoY) {
  targetCtx.save();
  targetCtx.translate(logoX, logoY);
  targetCtx.rotate(((state.rotation + state.penRotation) * Math.PI) / 180);
  targetCtx.strokeStyle = "rgba(242, 188, 75, 0.95)";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([8, 6]);
  targetCtx.strokeRect(-width / 2, -height / 2, width, height);
  targetCtx.restore();
}

function exportImage() {
  const sceneCanvas = document.createElement("canvas");
  sceneCanvas.width = canvas.width;
  sceneCanvas.height = canvas.height;
  renderScene(sceneCanvas.getContext("2d"), false);
  const format = EXPORT_FORMATS[exportFormat.value] || EXPORT_FORMATS.standard;
  triggerDownload(createExportCanvas(sceneCanvas, format), buildFilename(exportFormat.value));
  draw();
}

function createExportCanvas(sceneCanvas, format) {

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = format.width;
  finalCanvas.height = format.height;
  const finalCtx = finalCanvas.getContext("2d");
  const padding = Math.round(format.width * 0.035);
  const headerHeight = Math.max(88, Math.round(format.height * 0.13));
  const footerHeight = Math.max(54, Math.round(format.height * 0.07));
  const sceneHeight = format.height - headerHeight - footerHeight;

  finalCtx.fillStyle = "#ffffff";
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  if (brandImage.complete) {
    const logoWidth = Math.min(format.width * 0.32, 360);
    finalCtx.drawImage(brandImage, padding, Math.round(headerHeight * 0.28), logoWidth, logoWidth * 0.205);
  }

  finalCtx.fillStyle = "#16191f";
  finalCtx.font = `700 ${Math.max(20, Math.round(format.width * 0.025))}px Inter, system-ui, sans-serif`;
  finalCtx.textAlign = "right";
  finalCtx.fillText("Mockup de gravação", format.width - padding, Math.round(headerHeight * 0.45));
  finalCtx.fillStyle = "#65707f";
  finalCtx.font = `500 ${Math.max(14, Math.round(format.width * 0.014))}px Inter, system-ui, sans-serif`;
  finalCtx.fillText(state.selectedProduct ? `${state.selectedProduct.category} - ${state.selectedProduct.name}` : "Produto personalizado", format.width - padding, Math.round(headerHeight * 0.72));

  const scale = Math.min(format.width / sceneCanvas.width, sceneHeight / sceneCanvas.height);
  const drawWidth = sceneCanvas.width * scale;
  const drawHeight = sceneCanvas.height * scale;
  finalCtx.drawImage(sceneCanvas, (format.width - drawWidth) / 2, headerHeight + (sceneHeight - drawHeight) / 2, drawWidth, drawHeight);

  finalCtx.fillStyle = "#f3f6fa";
  finalCtx.fillRect(0, format.height - footerHeight, format.width, footerHeight);
  finalCtx.fillStyle = "#65707f";
  finalCtx.font = `600 ${Math.max(12, Math.round(format.width * 0.013))}px Inter, system-ui, sans-serif`;
  finalCtx.textAlign = "left";
  finalCtx.fillText("Newpen Signature | Prévia visual para aprovação de gravação", padding, format.height - Math.round(footerHeight * 0.4));
  finalCtx.textAlign = "right";
  finalCtx.fillText(new Date().toLocaleDateString("pt-BR"), format.width - padding, format.height - Math.round(footerHeight * 0.4));

  return finalCanvas;
}

function triggerDownload(canvasToSave, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvasToSave.toDataURL("image/png");
  link.click();
}

function buildFilename(formatKey) {
  const format = EXPORT_FORMATS[formatKey] || EXPORT_FORMATS.standard;
  const productName = state.selectedProduct ? `${state.selectedProduct.category}-${state.selectedProduct.name}` : "produto-personalizado";
  return `mockup-${slugify(productName)}-${format.label}.png`;
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mockup";
}

async function batchDownloadFilteredProducts() {
  if (!state.logo) {
    alert("Envie um logo antes de baixar as cores filtradas.");
    return;
  }

  const products = getFilteredProducts().slice(0, 30);
  if (!products.length) return;
  const previousProduct = state.selectedProduct;
  const format = EXPORT_FORMATS[exportFormat.value] || EXPORT_FORMATS.standard;

  batchDownloadBtn.disabled = true;
  batchDownloadBtn.textContent = `Baixando ${products.length}...`;

  for (const product of products) {
    state.selectedProduct = product;
    await loadPenAsync(product.src);
    applyProductProfile(product);
    const sceneCanvas = document.createElement("canvas");
    sceneCanvas.width = canvas.width;
    sceneCanvas.height = canvas.height;
    renderScene(sceneCanvas.getContext("2d"), false);
    triggerDownload(createExportCanvas(sceneCanvas, format), buildFilename(exportFormat.value));
    await wait(260);
  }

  if (previousProduct) {
    state.selectedProduct = previousProduct;
    await loadPenAsync(previousProduct.src);
    applyProductProfile(previousProduct);
  }
  renderProducts();
  draw();
  batchDownloadBtn.disabled = false;
  batchDownloadBtn.textContent = "Baixar cores filtradas";
}

function loadPenAsync(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = src.startsWith("data:") || src.startsWith("blob:") ? "" : "anonymous";
    image.onload = () => {
      state.pen = image;
      resolve();
    };
    image.src = src;
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function handlePointerDown(event) {
  if (!state.logo) return;
  const point = canvasPoint(event);
  state.isDragging = true;
  state.dragOffsetX = point.x - state.logoX;
  state.dragOffsetY = point.y - state.logoY;
  canvas.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (!state.isDragging) return;
  const point = canvasPoint(event);
  state.logoX = point.x - state.dragOffsetX;
  state.logoY = point.y - state.dragOffsetY;
  draw();
}

function handlePointerUp(event) {
  state.isDragging = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function readFileAsDataUrl(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

penGrid.addEventListener("click", (event) => {
  const option = event.target.closest("[data-src]");
  if (!option) return;
  const product = state.products.find((item) => item.src === option.dataset.src);
  if (product) selectProduct(product);
});

penUpload.addEventListener("change", (event) => {
  readFileAsDataUrl(event.target.files[0], (src) => {
    document.querySelectorAll(".pen-option").forEach((item) => item.classList.remove("is-active"));
    state.selectedProduct = null;
    loadPen(src);
  });
});

productSearch.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

productColorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    productColorButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.productColor = button.dataset.productColor;
    renderProducts();
  });
});

logoUpload.addEventListener("change", (event) => {
  readFileAsDataUrl(event.target.files[0], loadLogo);
});

penRotationControl.addEventListener("input", () => {
  state.penRotation = Number(penRotationControl.value);
  updateValueLabels();
  draw();
});

maskControl.addEventListener("input", () => {
  state.maskTolerance = Number(maskControl.value);
  updateValueLabels();
  draw();
});

scaleControl.addEventListener("input", () => {
  state.scale = Number(scaleControl.value) / 100;
  updateValueLabels();
  draw();
});

rotationControl.addEventListener("input", () => {
  state.rotation = Number(rotationControl.value);
  updateValueLabels();
  draw();
});

opacityControl.addEventListener("input", () => {
  state.opacity = Number(opacityControl.value) / 100;
  updateValueLabels();
  draw();
});

logoCutoutControl.addEventListener("input", () => {
  state.logoCutout = Number(logoCutoutControl.value);
  if (state.logoOriginal) state.logo = processLogoImage(state.logoOriginal);
  updateValueLabels();
  draw();
});

logoColorMode.addEventListener("change", () => {
  state.logoColorMode = logoColorMode.value;
  logoColorRow.classList.toggle("is-visible", state.logoColorMode === "custom");
  draw();
});

logoColorInput.addEventListener("input", () => {
  state.logoColor = logoColorInput.value;
  draw();
});

blendControl.addEventListener("input", () => {
  state.blend = Number(blendControl.value) / 100;
  updateValueLabels();
  draw();
});

fitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    fitButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.fit = button.dataset.fit;
    draw();
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modeButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    document.body.classList.toggle("simple-mode", button.dataset.mode === "simple");
  });
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

nudgeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const step = 8;
    const direction = button.dataset.nudge;
    if (direction === "up") state.logoY -= step;
    if (direction === "down") state.logoY += step;
    if (direction === "left") state.logoX -= step;
    if (direction === "right") state.logoX += step;
    draw();
  });
});

centerLogoBtn.addEventListener("click", centerLogo);
resetLogoBtn.addEventListener("click", resetLogoAdjustments);

saveProfileBtn.addEventListener("click", () => {
  saveCurrentProfile();
  saveProfileBtn.textContent = "Salvo";
  setTimeout(() => {
    saveProfileBtn.textContent = "Salvar padrão";
  }, 1200);
});

resetProfileBtn.addEventListener("click", () => {
  if (!state.selectedProduct) return;
  const profiles = getSavedProfiles();
  delete profiles[state.selectedProduct.src];
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  applyProductProfile(state.selectedProduct);
  draw();
});

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerUp);
canvas.addEventListener(
  "wheel",
  (event) => {
    if (!state.logo) return;
    event.preventDefault();
    if (event.shiftKey) {
      state.rotation = clamp(state.rotation + (event.deltaY > 0 ? 4 : -4), -360, 360);
      rotationControl.value = state.rotation;
    } else {
      state.scale = clamp(state.scale + (event.deltaY > 0 ? -0.015 : 0.015), 0.08, 0.9);
      scaleControl.value = Math.round(state.scale * 100);
    }
    updateValueLabels();
    draw();
  },
  { passive: false },
);
downloadBtn.addEventListener("click", exportImage);
batchDownloadBtn.addEventListener("click", batchDownloadFilteredProducts);
syncControlsFromState();
