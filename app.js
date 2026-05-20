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
const penGrid = document.querySelector("#penGrid");
const productSearch = document.querySelector("#productSearch");
const categoryFilter = document.querySelector("#categoryFilter");
const productCount = document.querySelector("#productCount");
const fitButtons = document.querySelectorAll("[data-fit]");
const productColorButtons = document.querySelectorAll("[data-product-color]");
const orientationButtons = document.querySelectorAll("[data-orientation]");
const selectedProductTitle = document.querySelector("#selectedProductTitle");
const selectedProductDescription = document.querySelector("#selectedProductDescription");
const selectedColorSwatch = document.querySelector("#selectedColorSwatch");
const detectedColors = document.querySelector("#detectedColors");
const printColors = document.querySelector("#printColors");
const colorWarning = document.querySelector("#colorWarning");
const summaryProduct = document.querySelector("#summaryProduct");
const summaryColors = document.querySelector("#summaryColors");
const summaryCustomization = document.querySelector("#summaryCustomization");
const summaryEngraving = document.querySelector("#summaryEngraving");
const logoActionButtons = document.querySelectorAll("[data-logo-action]");
const scaleValue = document.querySelector("#scaleValue");
const rotationValue = document.querySelector("#rotationValue");
const opacityValue = document.querySelector("#opacityValue");
const logoCutoutValue = document.querySelector("#logoCutoutValue");
const blendValue = document.querySelector("#blendValue");
const penRotationValue = document.querySelector("#penRotationValue");
const maskValue = document.querySelector("#maskValue");
const engravingEnabled = document.querySelector("#engravingEnabled");
const quantityInput = document.querySelector("#quantityInput");
const engravingTechnique = document.querySelector("#engravingTechnique");
const engravingArea = document.querySelector("#engravingArea");
const internalRef = document.querySelector("#internalRef");
const notesInput = document.querySelector("#notesInput");
const brandImage = new Image();
brandImage.src = "./assets/newpen-signature.png";

const state = {
  pen: new Image(),
  penBounds: null,
  logo: null,
  logoOriginal: null,
  products: [],
  selectedProduct: null,
  productColor: "all",
  fit: "contain",
  penOrientation: 0,
  penTilt: Number(penRotationControl.value),
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
  logoColors: [],
  isDragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
};

state.pen.crossOrigin = "anonymous";
updateControlLabels();
updateEngravingSummary();
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
    state.penBounds = detectImageBounds(image);
    draw();
  };
  image.src = src;
}

function loadLogo(src) {
  const image = new Image();
  image.onload = () => {
    state.logoOriginal = image;
    state.logo = processLogoImage(image);
    state.logoColors = detectLogoColors(state.logo);
    renderLogoColors();
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
    let visiblePixels = 0;
    let nonWhitePixels = 0;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      if (alpha < 20) continue;

      visiblePixels += 1;
      const nearWhite = red > 255 - tolerance && green > 255 - tolerance && blue > 255 - tolerance;
      if (!nearWhite) nonWhitePixels += 1;
    }

    const hasEnoughNonWhiteInk = visiblePixels > 0 && nonWhitePixels / visiblePixels > 0.08;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      const nearWhite = red > 255 - tolerance && green > 255 - tolerance && blue > 255 - tolerance;
      if (hasEnoughNonWhiteInk && alpha > 0 && nearWhite) data[index + 3] = 0;
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
  const term = normalizeText(productSearch.value);
  const category = categoryFilter.value;
  const filtered = state.products.filter((product) => {
    const productText = normalizeText(`${product.category} ${product.name}`);
    const matchesCategory = category === "all" || product.category === category;
    const matchesTerm = !term || productText.includes(term);
    const matchesColor = state.productColor === "all" || matchesProductColor(productText, state.productColor);
    return matchesCategory && matchesTerm && matchesColor;
  });

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
  updateProductDetails(product);
  updateEngravingDefaults(product);
  renderProducts();
}

function updateProductDetails(product) {
  const productLabel = `${product.category} - ${product.name}`;
  const colorHex = getProductColorHex(product);
  selectedProductTitle.textContent = productLabel;
  selectedProductDescription.textContent =
    "Caneta selecionada para simulacao visual. Envie o logo, ajuste a posicao e baixe a previa para aprovacao.";
  selectedColorSwatch.style.background = colorHex;
  summaryProduct.textContent = productLabel;
}

function updateEngravingDefaults(product) {
  if (!engravingArea || !engravingTechnique) return;
  const text = normalizeText(`${product.category} ${product.name}`);

  if (text.includes("clic")) {
    engravingArea.value = "35mm x 08mm";
  } else if (text.includes("newpop")) {
    engravingArea.value = "45mm x 20mm";
  } else if (text.includes("metal") || text.includes("chromo") || text.includes("galaxy")) {
    engravingArea.value = "50mm x 20mm";
    engravingTechnique.value = "Digital";
  } else if (text.includes("lapis")) {
    engravingArea.value = "50mm x 20mm";
    engravingTechnique.value = "Transfer";
  } else {
    engravingArea.value = "50mm x 20mm";
  }

  updateEngravingSummary();
}

function getProductColorHex(product) {
  const text = normalizeText(`${product.category} ${product.name}`);
  const colors = [
    ["preta", "#1f2933"],
    ["preto", "#1f2933"],
    ["branca", "#f8fafc"],
    ["branco", "#f8fafc"],
    ["azul", "#27496d"],
    ["vermelha", "#b4232f"],
    ["vermelho", "#b4232f"],
    ["verde", "#2f6f4f"],
    ["amarela", "#e2b83b"],
    ["amarelo", "#e2b83b"],
    ["rosa", "#d65a8a"],
    ["roxo", "#6d4fb3"],
    ["roxa", "#6d4fb3"],
    ["laranja", "#df7b2d"],
    ["dourada", "#c79a2b"],
    ["dourado", "#c79a2b"],
    ["prata", "#9aa3ad"],
  ];
  const match = colors.find(([term]) => text.includes(term));
  return match ? match[1] : "#27496d";
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function draw() {
  renderScene(ctx, true);
  updateControlLabels();
  updateEngravingSummary();
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

  const bounds = state.penBounds || { x: 0, y: 0, width: state.pen.width, height: state.pen.height };
  const size = getFitSize(bounds, state.fit, frame.width, frame.height);
  const angle = (getPenRotation() * Math.PI) / 180;
  const rotatedWidth = Math.abs(size.width * Math.cos(angle)) + Math.abs(size.height * Math.sin(angle));
  const rotatedHeight = Math.abs(size.width * Math.sin(angle)) + Math.abs(size.height * Math.cos(angle));
  const rotationScale =
    state.fit === "contain" ? Math.min(1, frame.width / rotatedWidth, frame.height / rotatedHeight) : 1;

  targetCtx.save();
  targetCtx.translate(frame.centerX, frame.centerY);
  targetCtx.rotate(angle);
  targetCtx.drawImage(
    state.pen,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    (-size.width * rotationScale) / 2,
    (-size.height * rotationScale) / 2,
    size.width * rotationScale,
    size.height * rotationScale,
  );
  targetCtx.restore();
}

function getFitSize(image, mode, targetWidth = canvas.width, targetHeight = canvas.height) {
  const sourceWidth = image.width || image.naturalWidth || 0;
  const sourceHeight = image.height || image.naturalHeight || 0;
  const isDrawable = image.complete === undefined || image.complete;
  if (!isDrawable || sourceWidth === 0 || sourceHeight === 0) return { width: 0, height: 0 };

  const canvasRatio = targetWidth / targetHeight;
  const imageRatio = sourceWidth / sourceHeight;

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
  targetCtx.rotate(((state.rotation + getPenRotation()) * Math.PI) / 180);
  targetCtx.globalAlpha = state.opacity;
  targetCtx.globalCompositeOperation = isLightLogo() ? "screen" : "multiply";
  targetCtx.filter = isLightLogo()
    ? `contrast(${1 + bend * 0.42}) saturate(${1 - bend * 0.25}) brightness(${1 + bend * 0.08})`
    : `contrast(${1 + bend * 0.55}) saturate(${1 - bend * 0.42}) brightness(${1 - bend * 0.12})`;

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
  targetCtx.rotate(((state.rotation + getPenRotation()) * Math.PI) / 180);
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

function isLightLogo() {
  const forcedColor = getLogoColor();
  if (forcedColor) return getColorBrightness(forcedColor) > 188;
  if (!state.logoColors.length) return false;

  const totalWeight = state.logoColors.reduce((total, color) => total + color.count, 0) || 1;
  const averageBrightness = state.logoColors.reduce((total, color) => {
    return total + getColorBrightness(color.hex) * color.count;
  }, 0) / totalWeight;

  return averageBrightness > 188;
}

function getColorBrightness(hex) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0;
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000;
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
  targetCtx.rotate(((state.rotation + getPenRotation()) * Math.PI) / 180);
  targetCtx.strokeStyle = "rgba(242, 188, 75, 0.95)";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([8, 6]);
  targetCtx.strokeRect(-width / 2, -height / 2, width, height);
  targetCtx.restore();
}

function getPenRotation() {
  return state.penOrientation + state.penTilt;
}

function detectImageBounds(image) {
  const sampleCanvas = document.createElement("canvas");
  const maxSide = 520;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  sampleCanvas.width = Math.max(1, Math.round(image.width * ratio));
  sampleCanvas.height = Math.max(1, Math.round(image.height * ratio));

  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  sampleCtx.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);
  const pixels = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;

  let minX = sampleCanvas.width;
  let minY = sampleCanvas.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < sampleCanvas.height; y += 1) {
    for (let x = 0; x < sampleCanvas.width; x += 1) {
      const index = (y * sampleCanvas.width + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const isInk = alpha > 30 && !(red > 245 && green > 245 && blue > 245);

      if (isInk) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= maxX || minY >= maxY) return { x: 0, y: 0, width: image.width, height: image.height };

  const padding = 10;
  const scale = 1 / ratio;
  return {
    x: Math.max(0, Math.floor((minX - padding) * scale)),
    y: Math.max(0, Math.floor((minY - padding) * scale)),
    width: Math.min(image.width, Math.ceil((maxX - minX + padding * 2) * scale)),
    height: Math.min(image.height, Math.ceil((maxY - minY + padding * 2) * scale)),
  };
}

function detectLogoColors(sourceCanvas) {
  const sampleCanvas = document.createElement("canvas");
  const maxSide = 160;
  const ratio = Math.min(1, maxSide / Math.max(sourceCanvas.width, sourceCanvas.height));
  sampleCanvas.width = Math.max(1, Math.round(sourceCanvas.width * ratio));
  sampleCanvas.height = Math.max(1, Math.round(sourceCanvas.height * ratio));
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  sampleCtx.drawImage(sourceCanvas, 0, 0, sampleCanvas.width, sampleCanvas.height);

  const pixels = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const buckets = new Map();
  let whiteCount = 0;
  let whiteRed = 0;
  let whiteGreen = 0;
  let whiteBlue = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha < 40) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const nearWhite = red > 245 && green > 245 && blue > 245;
    if (nearWhite) {
      whiteCount += 1;
      whiteRed += red;
      whiteGreen += green;
      whiteBlue += blue;
      continue;
    }

    const key = [red, green, blue].map((value) => Math.round(value / 32) * 32).join(",");
    const bucket = buckets.get(key) || { count: 0, red: 0, green: 0, blue: 0 };
    bucket.count += 1;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
  }

  const colors = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
    .map((bucket) => ({
      hex: rgbToHex(
        Math.round(bucket.red / bucket.count),
        Math.round(bucket.green / bucket.count),
        Math.round(bucket.blue / bucket.count),
      ),
      count: bucket.count,
    }));

  if (whiteCount > 0 && colors.length < 7) {
    colors.unshift({
      hex: rgbToHex(
        Math.round(whiteRed / whiteCount),
        Math.round(whiteGreen / whiteCount),
        Math.round(whiteBlue / whiteCount),
      ),
      count: whiteCount,
    });
  }

  return colors.slice(0, 7);
}

function renderLogoColors() {
  detectedColors.innerHTML = "";
  printColors.innerHTML = "";
  const colors = state.logoColors;

  if (!colors.length) {
    detectedColors.innerHTML = '<p class="hint">Nenhuma cor detectada ainda.</p>';
    printColors.innerHTML = '<p class="hint">Envie um logo para ver as cores.</p>';
    summaryColors.textContent = "0";
    colorWarning.classList.add("is-hidden");
    return;
  }

  colors.forEach((color, index) => {
    const colorItem = document.createElement("div");
    colorItem.className = "color-item";
    colorItem.innerHTML = `<span class="color-chip" style="--chip: ${color.hex}"></span><span>Cor ${index + 1}</span>`;
    detectedColors.appendChild(colorItem);

    const printItem = document.createElement("label");
    printItem.className = "print-item";
    printItem.innerHTML = `
      <span class="color-chip" style="--chip: ${color.hex}"></span>
      <select aria-label="Cor de impressao ${index + 1}">
        <option>Pantone aprox. ${color.hex.toUpperCase()}</option>
        <option>Sem cor</option>
        <option>Manter original</option>
      </select>
    `;
    printColors.appendChild(printItem);
  });

  summaryColors.textContent = `${colors.length}`;
  colorWarning.classList.toggle("is-hidden", colors.length <= 4);
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function updateControlLabels() {
  if (scaleValue) scaleValue.textContent = `${Math.round(state.scale * 100)}%`;
  if (rotationValue) rotationValue.textContent = `${Math.round(state.rotation)}°`;
  if (opacityValue) opacityValue.textContent = `${Math.round(state.opacity * 100)}%`;
  if (logoCutoutValue) logoCutoutValue.textContent = `${state.logoCutout}`;
  if (blendValue) blendValue.textContent = `${Math.round(state.blend * 100)}%`;
  if (penRotationValue) penRotationValue.textContent = `${state.penTilt}°`;
  if (maskValue) maskValue.textContent = `${state.maskTolerance}`;
}

function updateEngravingSummary() {
  if (!summaryCustomization || !summaryEngraving) return;

  const technique = engravingTechnique?.value || "Serigrafia";
  const area = engravingArea?.value || "50mm x 20mm";
  const quantity = quantityInput?.value || "250";
  const enabled = engravingEnabled?.checked ?? true;

  summaryCustomization.textContent = `Corpo | ${technique} | ${area}`;
  summaryEngraving.textContent = enabled ? `Incluída | ${quantity} peças` : "Sem gravação";
}

function handleLogoAction(action) {
  if (!state.logo && action !== "center" && action !== "reset") return;

  const moveStep = 22;
  const scaleStep = 0.035;

  if (action === "up") state.logoY -= moveStep;
  if (action === "down") state.logoY += moveStep;
  if (action === "left") state.logoX -= moveStep;
  if (action === "right") state.logoX += moveStep;
  if (action === "center") {
    state.logoX = canvas.width * 0.5;
    state.logoY = canvas.height * 0.52;
  }
  if (action === "smaller") state.scale = clamp(state.scale - scaleStep, 0.08, 0.9);
  if (action === "bigger") state.scale = clamp(state.scale + scaleStep, 0.08, 0.9);
  if (action === "rotate-left") state.rotation = clamp(state.rotation - 5, -360, 360);
  if (action === "rotate-right") state.rotation = clamp(state.rotation + 5, -360, 360);
  if (action === "reset") {
    state.logoX = canvas.width * 0.5;
    state.logoY = canvas.height * 0.52;
    state.scale = 0.26;
    state.rotation = -9;
    state.opacity = 0.92;
    state.blend = 0.34;
  }

  scaleControl.value = Math.round(state.scale * 100);
  rotationControl.value = Math.round(state.rotation);
  opacityControl.value = Math.round(state.opacity * 100);
  blendControl.value = Math.round(state.blend * 100);
  draw();
}

function exportImage() {
  const sceneCanvas = document.createElement("canvas");
  sceneCanvas.width = canvas.width;
  sceneCanvas.height = canvas.height;
  renderScene(sceneCanvas.getContext("2d"), false);

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = 1200;
  finalCanvas.height = 980;
  const finalCtx = finalCanvas.getContext("2d");

  finalCtx.fillStyle = "#ffffff";
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  if (brandImage.complete) finalCtx.drawImage(brandImage, 42, 34, 360, 74);

  finalCtx.fillStyle = "#16191f";
  finalCtx.font = "700 30px Inter, system-ui, sans-serif";
  finalCtx.textAlign = "right";
  finalCtx.fillText("Mockup de gravação", 1158, 62);
  finalCtx.fillStyle = "#65707f";
  finalCtx.font = "500 17px Inter, system-ui, sans-serif";
  finalCtx.fillText(state.selectedProduct ? `${state.selectedProduct.category} - ${state.selectedProduct.name}` : "Produto personalizado", 1158, 92);

  finalCtx.drawImage(sceneCanvas, 0, 130, 1200, 760);

  finalCtx.fillStyle = "#f3f6fa";
  finalCtx.fillRect(0, 910, 1200, 70);
  finalCtx.fillStyle = "#65707f";
  finalCtx.font = "600 16px Inter, system-ui, sans-serif";
  finalCtx.textAlign = "left";
  finalCtx.fillText("Newpen Signature | Prévia visual para aprovação de gravação", 42, 952);
  finalCtx.textAlign = "right";
  finalCtx.fillText(new Date().toLocaleDateString("pt-BR"), 1158, 952);

  const link = document.createElement("a");
  link.download = "mockup-logo-caneta.png";
  link.href = finalCanvas.toDataURL("image/png");
  link.click();
  draw();
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
    selectedProductTitle.textContent = "Caneta personalizada";
    selectedProductDescription.textContent = "Foto propria enviada para simulacao.";
    summaryProduct.textContent = "Caneta personalizada";
    engravingArea.value = "50mm x 20mm";
    updateEngravingSummary();
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
  state.penTilt = Number(penRotationControl.value);
  draw();
});

orientationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    orientationButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.penOrientation = Number(button.dataset.orientation);
    draw();
  });
});

maskControl.addEventListener("input", () => {
  state.maskTolerance = Number(maskControl.value);
  draw();
});

scaleControl.addEventListener("input", () => {
  state.scale = Number(scaleControl.value) / 100;
  draw();
});

rotationControl.addEventListener("input", () => {
  state.rotation = Number(rotationControl.value);
  draw();
});

opacityControl.addEventListener("input", () => {
  state.opacity = Number(opacityControl.value) / 100;
  draw();
});

logoCutoutControl.addEventListener("input", () => {
  state.logoCutout = Number(logoCutoutControl.value);
  if (state.logoOriginal) {
    state.logo = processLogoImage(state.logoOriginal);
    state.logoColors = detectLogoColors(state.logo);
    renderLogoColors();
  }
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
  draw();
});

logoActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleLogoAction(button.dataset.logoAction);
  });
});

[engravingEnabled, quantityInput, engravingTechnique, engravingArea, internalRef, notesInput].forEach((field) => {
  field?.addEventListener("input", updateEngravingSummary);
  field?.addEventListener("change", updateEngravingSummary);
});

fitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    fitButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.fit = button.dataset.fit;
    draw();
  });
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
    draw();
  },
  { passive: false },
);
downloadBtn.addEventListener("click", exportImage);
