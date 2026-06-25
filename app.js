(() => {
  "use strict";

  const APP_VERSION = "0.2.0";
  const STORAGE_KEY = "inkscreen.studio.v2";
  const SCHEMA = "inkscreen.package.v1";
  const CHUNK_SIZE = 180;

  const SERVICE_UUID = "9f2a0001-6f37-4f1e-9a5e-1b5c00000001";
  const CONTROL_UUID = "9f2a0002-6f37-4f1e-9a5e-1b5c00000001";
  const DATA_UUID = "9f2a0003-6f37-4f1e-9a5e-1b5c00000001";
  const STATUS_UUID = "9f2a0004-6f37-4f1e-9a5e-1b5c00000001";

  const KIND_LABELS = {
    dashboard: "看板",
    agenda: "日程",
    checklist: "清单",
    quote: "便签",
    image: "图片"
  };

  const DEFAULT_BODY = {
    dashboard: "天气 26C\n待办 3\n下一节 10:10 电路分析\n电量 86%",
    agenda: "08:00 | 高等数学 | A201\n10:10 | 电路分析 | B105\n14:00 | 自习 / 项目\n19:30 | 跑步 30 min",
    checklist: "- [ ] 复习电路\n- [x] 提交作业\n- [ ] 整理桌面\n- [ ] 更新墨水屏",
    quote: "把今天留一点给自己。\n\n可以是一页计划，也可以只是一句提醒。",
    image: "上传一张图片后会自动适配到屏幕区域。"
  };

  const PRESETS = new Map([
    ["250x122", { width: 250, height: 122 }],
    ["122x250", { width: 122, height: 250 }],
    ["296x128", { width: 296, height: 128 }],
    ["400x300", { width: 400, height: 300 }]
  ]);

  const el = {};

  const state = {
    activePageId: "",
    model: null,
    payload: new Uint8Array(),
    meta: null,
    packageText: "",
    logLines: [],
    imageCache: new Map(),
    ble: {
      device: null,
      server: null,
      control: null,
      data: null,
      status: null
    }
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindElements();
    state.model = restoreState() || createDefaultModel();
    normalizeModel();
    state.activePageId = state.model.pages[0].id;
    bindEvents();
    syncFormFromState();
    renderPageList();
    updateConnectionUi();
    drawPreviewAndMetrics();
    registerServiceWorker();
    logLine("就绪：内容会保存到本机浏览器，导出 JSON 可直接给 ESP32 固件解析。");
  }

  function bindElements() {
    const ids = [
      "connectionStatus",
      "addPageButton",
      "duplicatePageButton",
      "deletePageButton",
      "pageList",
      "pageTitleInput",
      "bodyInput",
      "footerInput",
      "imageField",
      "imageInput",
      "previewCanvas",
      "presetInput",
      "widthInput",
      "heightInput",
      "ditherInput",
      "thresholdInput",
      "invertInput",
      "pageMetric",
      "payloadSize",
      "crcValue",
      "packageSize",
      "bleConnectButton",
      "blePackageButton",
      "bleBitmapButton",
      "ssidInput",
      "passwordInput",
      "wifiConfigButton",
      "deviceIpInput",
      "wifiPackageButton",
      "wifiBitmapButton",
      "downloadPackageButton",
      "downloadPngButton",
      "logOutput"
    ];

    ids.forEach((id) => {
      el[id] = document.getElementById(id);
    });
    el.kindButtons = Array.from(document.querySelectorAll("[data-kind]"));
  }

  function bindEvents() {
    el.addPageButton.addEventListener("click", addPage);
    el.duplicatePageButton.addEventListener("click", duplicatePage);
    el.deletePageButton.addEventListener("click", deletePage);

    el.pageTitleInput.addEventListener("input", () => {
      updateActivePage({ title: el.pageTitleInput.value });
    });
    el.bodyInput.addEventListener("input", () => {
      updateActivePage({ body: el.bodyInput.value });
    });
    el.footerInput.addEventListener("input", () => {
      updateActivePage({ footer: el.footerInput.value });
    });
    el.imageInput.addEventListener("change", handleImageUpload);

    el.kindButtons.forEach((button) => {
      button.addEventListener("click", () => setPageKind(button.dataset.kind));
    });

    el.presetInput.addEventListener("change", applyPreset);
    el.widthInput.addEventListener("input", () => setTargetSize("width", el.widthInput.value));
    el.heightInput.addEventListener("input", () => setTargetSize("height", el.heightInput.value));
    el.ditherInput.addEventListener("change", () => setRenderOption("dither", el.ditherInput.value));
    el.thresholdInput.addEventListener("input", () => setRenderOption("threshold", Number(el.thresholdInput.value)));
    el.invertInput.addEventListener("change", () => setRenderOption("invert", el.invertInput.checked));

    el.bleConnectButton.addEventListener("click", connectBle);
    el.blePackageButton.addEventListener("click", sendBlePackage);
    el.bleBitmapButton.addEventListener("click", sendBleBitmap);
    el.wifiConfigButton.addEventListener("click", sendWifiConfig);
    el.wifiPackageButton.addEventListener("click", sendWifiPackage);
    el.wifiBitmapButton.addEventListener("click", sendWifiBitmap);
    el.downloadPackageButton.addEventListener("click", downloadPackage);
    el.downloadPngButton.addEventListener("click", downloadPng);
  }

  function createDefaultModel() {
    return {
      packageTitle: "InkScreen Deck",
      target: {
        width: 250,
        height: 122,
        color: "bw",
        bpp: 1,
        pixelOrder: "row-major",
        bitOrder: "msb",
        blackBit: 1
      },
      render: {
        threshold: 156,
        dither: "threshold",
        invert: false,
        fontScale: 1
      },
      pages: [
        createPage("dashboard", {
          id: "page_home",
          title: "今日看板",
          body: DEFAULT_BODY.dashboard,
          footer: "InkScreen"
        }),
        createPage("agenda", {
          id: "page_agenda",
          title: "课程表",
          body: DEFAULT_BODY.agenda,
          footer: "旋钮翻页，按下确认"
        })
      ]
    };
  }

  function createPage(kind = "dashboard", seed = {}) {
    return {
      id: seed.id || createId("page"),
      title: seed.title || KIND_LABELS[kind] || "页面",
      kind,
      durationSec: seed.durationSec || 0,
      body: seed.body ?? DEFAULT_BODY[kind] ?? "",
      footer: seed.footer ?? "",
      imageDataUrl: seed.imageDataUrl || ""
    };
  }

  function normalizeModel() {
    state.model = state.model || createDefaultModel();
    state.model.target = {
      width: 250,
      height: 122,
      color: "bw",
      bpp: 1,
      pixelOrder: "row-major",
      bitOrder: "msb",
      blackBit: 1,
      ...(state.model.target || {})
    };
    state.model.render = {
      threshold: 156,
      dither: "threshold",
      invert: false,
      fontScale: 1,
      ...(state.model.render || {})
    };
    if (!Array.isArray(state.model.pages) || state.model.pages.length === 0) {
      state.model.pages = [createPage("dashboard")];
    }
    state.model.pages = state.model.pages.map((page) => ({
      ...createPage(page.kind || "dashboard"),
      ...page,
      id: page.id || createId("page"),
      kind: page.kind || "dashboard"
    }));
  }

  function getActivePage() {
    return state.model.pages.find((page) => page.id === state.activePageId) || state.model.pages[0];
  }

  function syncFormFromState() {
    const page = getActivePage();
    el.pageTitleInput.value = page.title || "";
    el.bodyInput.value = page.body || "";
    el.footerInput.value = page.footer || "";
    el.widthInput.value = state.model.target.width;
    el.heightInput.value = state.model.target.height;
    el.ditherInput.value = state.model.render.dither;
    el.thresholdInput.value = state.model.render.threshold;
    el.invertInput.checked = Boolean(state.model.render.invert);
    const presetKey = `${state.model.target.width}x${state.model.target.height}`;
    el.presetInput.value = PRESETS.has(presetKey) ? presetKey : "custom";
    syncKindButtons();
  }

  function syncKindButtons() {
    const page = getActivePage();
    el.kindButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.kind === page.kind);
    });
    el.imageField.classList.toggle("is-hidden", page.kind !== "image");
  }

  function renderPageList() {
    el.pageList.replaceChildren();
    state.model.pages.forEach((page, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-item";
      button.classList.toggle("is-active", page.id === state.activePageId);
      button.addEventListener("click", () => selectPage(page.id));

      const title = document.createElement("span");
      title.className = "page-title";
      title.textContent = `${index + 1}. ${page.title || "未命名"}`;

      const kind = document.createElement("span");
      kind.className = "page-kind";
      kind.textContent = KIND_LABELS[page.kind] || page.kind;

      button.append(title, kind);
      el.pageList.append(button);
    });
  }

  function selectPage(id) {
    state.activePageId = id;
    syncFormFromState();
    renderPageList();
    drawPreviewAndMetrics();
    persistState();
  }

  function addPage() {
    const currentIndex = state.model.pages.findIndex((page) => page.id === state.activePageId);
    const page = createPage("dashboard", {
      title: `新页面 ${state.model.pages.length + 1}`,
      body: DEFAULT_BODY.dashboard
    });
    state.model.pages.splice(Math.max(0, currentIndex + 1), 0, page);
    selectPage(page.id);
    logLine(`已新增页面：${page.title}`);
  }

  function duplicatePage() {
    const current = getActivePage();
    const copy = {
      ...structuredCloneSafe(current),
      id: createId("page"),
      title: `${current.title || "页面"} 副本`
    };
    const currentIndex = state.model.pages.findIndex((page) => page.id === current.id);
    state.model.pages.splice(currentIndex + 1, 0, copy);
    selectPage(copy.id);
    logLine(`已复制页面：${current.title || "页面"}`);
  }

  function deletePage() {
    if (state.model.pages.length <= 1) {
      logLine("至少需要保留一页内容。");
      return;
    }
    const index = state.model.pages.findIndex((page) => page.id === state.activePageId);
    const removed = state.model.pages.splice(index, 1)[0];
    const next = state.model.pages[Math.max(0, index - 1)] || state.model.pages[0];
    selectPage(next.id);
    logLine(`已删除页面：${removed.title || "页面"}`);
  }

  function updateActivePage(changes) {
    Object.assign(getActivePage(), changes);
    renderPageList();
    drawPreviewAndMetrics();
    persistState();
  }

  function setPageKind(kind) {
    const page = getActivePage();
    page.kind = kind;
    if (!page.body.trim()) {
      page.body = DEFAULT_BODY[kind] || "";
      el.bodyInput.value = page.body;
    }
    syncKindButtons();
    renderPageList();
    drawPreviewAndMetrics();
    persistState();
  }

  function applyPreset() {
    const preset = PRESETS.get(el.presetInput.value);
    if (!preset) {
      return;
    }
    state.model.target.width = preset.width;
    state.model.target.height = preset.height;
    el.widthInput.value = preset.width;
    el.heightInput.value = preset.height;
    drawPreviewAndMetrics();
    persistState();
  }

  function setTargetSize(axis, value) {
    const number = clamp(Number(value) || 0, 64, 1200);
    state.model.target[axis] = number;
    const presetKey = `${state.model.target.width}x${state.model.target.height}`;
    el.presetInput.value = PRESETS.has(presetKey) ? presetKey : "custom";
    drawPreviewAndMetrics();
    persistState();
  }

  function setRenderOption(key, value) {
    state.model.render[key] = value;
    drawPreviewAndMetrics();
    persistState();
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const page = getActivePage();
      page.imageDataUrl = String(reader.result || "");
      page.kind = "image";
      page.title = page.title || file.name.replace(/\.[^.]+$/, "");
      el.pageTitleInput.value = page.title;
      syncKindButtons();
      renderPageList();
      drawPreviewAndMetrics();
      persistState();
      logLine(`已载入图片：${file.name}`);
    });
    reader.readAsDataURL(file);
  }

  function drawPreviewAndMetrics() {
    const page = getActivePage();
    renderPageToCanvas(page, el.previewCanvas);
    const bitmap = packCanvas(el.previewCanvas);
    state.payload = bitmap.bytes;
    state.meta = bitmap.meta;
    state.packageText = JSON.stringify(buildPackage(), null, 2);

    const pageIndex = state.model.pages.findIndex((item) => item.id === page.id) + 1;
    el.pageMetric.textContent = `${pageIndex} / ${state.model.pages.length}`;
    el.payloadSize.textContent = `${bitmap.bytes.length} B`;
    el.crcValue.textContent = bitmap.meta.crc32;
    el.packageSize.textContent = `${new TextEncoder().encode(state.packageText).length} B`;
  }

  function renderPageToCanvas(page, canvas) {
    const target = state.model.target;
    const render = state.model.render;
    const width = clamp(Math.round(target.width), 64, 1200);
    const height = clamp(Math.round(target.height), 64, 1200);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#111111";
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 1;

    const size = getCanvasSizes(width, height);
    if (page.kind === "agenda") {
      drawAgenda(ctx, page, width, height, size);
    } else if (page.kind === "checklist") {
      drawChecklist(ctx, page, width, height, size);
    } else if (page.kind === "quote") {
      drawQuote(ctx, page, width, height, size);
    } else if (page.kind === "image") {
      drawImagePage(ctx, page, width, height, size);
    } else {
      drawDashboard(ctx, page, width, height, size);
    }
    drawFooter(ctx, page, width, height, size);
    ctx.restore();
    applyMono(ctx, width, height, render);
  }

  function getCanvasSizes(width, height) {
    const minSide = Math.min(width, height);
    const scale = state.model.render.fontScale || 1;
    return {
      margin: Math.max(6, Math.round(minSide * 0.07)),
      gap: Math.max(4, Math.round(minSide * 0.035)),
      title: Math.max(13, Math.round(minSide * 0.145 * scale)),
      body: Math.max(10, Math.round(minSide * 0.105 * scale)),
      small: Math.max(8, Math.round(minSide * 0.078 * scale))
    };
  }

  function drawHeader(ctx, page, width, size) {
    const y = size.margin + size.title;
    ctx.font = `800 ${size.title}px system-ui, sans-serif`;
    drawFitText(ctx, page.title || "InkScreen", size.margin, y, width - size.margin * 2);
    ctx.beginPath();
    ctx.moveTo(size.margin, y + Math.round(size.gap * 0.9));
    ctx.lineTo(width - size.margin, y + Math.round(size.gap * 0.9));
    ctx.stroke();
    return y + size.gap * 2;
  }

  function drawDashboard(ctx, page, width, height, size) {
    const yStart = drawHeader(ctx, page, width, size);
    const metrics = parseMetricLines(page.body || DEFAULT_BODY.dashboard).slice(0, 6);
    const columns = width > height * 1.25 ? 2 : 1;
    const rows = Math.ceil(metrics.length / columns) || 1;
    const bottomLimit = height - size.margin - size.small * 1.8;
    const availableH = Math.max(20, bottomLimit - yStart);
    const cellW = (width - size.margin * 2 - size.gap * (columns - 1)) / columns;
    const cellH = Math.max(20, (availableH - size.gap * (rows - 1)) / rows);

    metrics.forEach((metric, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = size.margin + col * (cellW + size.gap);
      const y = yStart + row * (cellH + size.gap);
      ctx.strokeRect(x, y, cellW, cellH);
      ctx.fillRect(x, y, Math.max(2, Math.round(size.gap * 0.5)), cellH);
      ctx.font = `700 ${size.small}px system-ui, sans-serif`;
      drawFitText(ctx, metric.label, x + size.gap, y + size.small + 3, cellW - size.gap * 2);
      ctx.font = `900 ${Math.max(size.body + 3, Math.round(cellH * 0.38))}px system-ui, sans-serif`;
      drawFitText(ctx, metric.value, x + size.gap, y + cellH - size.small - 3, cellW - size.gap * 2);
      if (metric.note) {
        ctx.font = `600 ${size.small}px system-ui, sans-serif`;
        ctx.fillStyle = "#666666";
        drawFitText(ctx, metric.note, x + size.gap, y + cellH - 4, cellW - size.gap * 2);
        ctx.fillStyle = "#111111";
      }
    });
  }

  function drawAgenda(ctx, page, width, height, size) {
    let y = drawHeader(ctx, page, width, size);
    const items = parseAgendaLines(page.body || DEFAULT_BODY.agenda);
    const bottomLimit = height - size.margin - size.small * 1.8;
    const rowH = Math.max(size.body + 7, Math.floor((bottomLimit - y) / Math.max(1, items.length)));
    const timeW = Math.min(Math.max(42, width * 0.24), 68);

    items.forEach((item) => {
      if (y + rowH > bottomLimit + 2) {
        return;
      }
      ctx.strokeRect(size.margin, y, width - size.margin * 2, rowH - 2);
      ctx.font = `800 ${size.body}px system-ui, sans-serif`;
      drawFitText(ctx, item.time, size.margin + size.gap, y + size.body + 3, timeW - size.gap);
      ctx.font = `700 ${size.body}px system-ui, sans-serif`;
      drawFitText(ctx, item.text, size.margin + timeW, y + size.body + 3, width - size.margin * 2 - timeW - size.gap);
      if (item.meta) {
        ctx.font = `600 ${size.small}px system-ui, sans-serif`;
        ctx.fillStyle = "#666666";
        drawFitText(ctx, item.meta, size.margin + timeW, y + rowH - 6, width - size.margin * 2 - timeW - size.gap);
        ctx.fillStyle = "#111111";
      }
      y += rowH;
    });
  }

  function drawChecklist(ctx, page, width, height, size) {
    let y = drawHeader(ctx, page, width, size);
    const items = parseChecklistLines(page.body || DEFAULT_BODY.checklist);
    const bottomLimit = height - size.margin - size.small * 1.8;
    const rowH = Math.max(size.body + 8, Math.floor((bottomLimit - y) / Math.max(1, items.length)));
    const box = clamp(Math.round(size.body * 0.85), 9, 16);

    items.forEach((item) => {
      if (y + rowH > bottomLimit + 2) {
        return;
      }
      const boxY = y + Math.round((rowH - box) / 2);
      ctx.strokeRect(size.margin, boxY, box, box);
      if (item.checked) {
        ctx.beginPath();
        ctx.moveTo(size.margin + 3, boxY + Math.round(box * 0.55));
        ctx.lineTo(size.margin + Math.round(box * 0.42), boxY + box - 3);
        ctx.lineTo(size.margin + box - 2, boxY + 3);
        ctx.stroke();
      }
      ctx.font = `700 ${size.body}px system-ui, sans-serif`;
      drawFitText(ctx, item.text, size.margin + box + size.gap, y + Math.round((rowH + size.body) / 2) - 2, width - size.margin * 2 - box - size.gap);
      y += rowH;
    });
  }

  function drawQuote(ctx, page, width, height, size) {
    let y = drawHeader(ctx, page, width, size);
    const bottomLimit = height - size.margin - size.small * 2.1;
    const bodyFont = Math.max(size.body + 2, Math.round(Math.min(width, height) * 0.13));
    ctx.font = `800 ${bodyFont}px system-ui, sans-serif`;
    const lineHeight = Math.round(bodyFont * 1.26);
    y += size.gap;
    drawWrappedText(ctx, page.body || DEFAULT_BODY.quote, size.margin, y, width - size.margin * 2, lineHeight, bottomLimit);
  }

  function drawImagePage(ctx, page, width, height, size) {
    const yStart = drawHeader(ctx, page, width, size);
    const bottomLimit = height - size.margin - size.small * 1.8;
    const areaX = size.margin;
    const areaY = yStart;
    const areaW = width - size.margin * 2;
    const areaH = Math.max(20, bottomLimit - yStart);
    ctx.strokeRect(areaX, areaY, areaW, areaH);

    const img = getImage(page.imageDataUrl);
    if (img && img.complete && img.naturalWidth > 0) {
      const scale = Math.min(areaW / img.naturalWidth, areaH / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const drawX = areaX + (areaW - drawW) / 2;
      const drawY = areaY + (areaH - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      return;
    }

    ctx.font = `700 ${size.body}px system-ui, sans-serif`;
    ctx.fillStyle = "#555555";
    drawWrappedText(ctx, page.body || DEFAULT_BODY.image, areaX + size.gap, areaY + size.body + size.gap, areaW - size.gap * 2, Math.round(size.body * 1.3), areaY + areaH - size.gap);
    ctx.fillStyle = "#111111";
  }

  function drawFooter(ctx, page, width, height, size) {
    if (!page.footer) {
      return;
    }
    ctx.font = `700 ${size.small}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    drawFitText(ctx, page.footer, width - size.margin, height - size.margin, width - size.margin * 2);
    ctx.textAlign = "left";
  }

  function drawFitText(ctx, text, x, y, maxWidth) {
    const value = String(text || "");
    if (ctx.measureText(value).width <= maxWidth) {
      ctx.fillText(value, x, y);
      return;
    }
    let clipped = value;
    while (clipped.length > 1 && ctx.measureText(`${clipped}...`).width > maxWidth) {
      clipped = clipped.slice(0, -1);
    }
    ctx.fillText(`${clipped}...`, x, y);
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxY) {
    const lines = wrapLines(ctx, text, maxWidth);
    let cursor = y;
    for (const line of lines) {
      if (cursor > maxY) {
        break;
      }
      drawFitText(ctx, line, x, cursor, maxWidth);
      cursor += lineHeight;
    }
    return cursor;
  }

  function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    String(text || "").split(/\r?\n/).forEach((paragraph) => {
      if (!paragraph) {
        lines.push("");
        return;
      }
      let line = "";
      Array.from(paragraph).forEach((char) => {
        const next = line + char;
        if (line && ctx.measureText(next).width > maxWidth) {
          lines.push(line);
          line = char.trimStart();
        } else {
          line = next;
        }
      });
      lines.push(line);
    });
    return lines;
  }

  function getImage(src) {
    if (!src) {
      return null;
    }
    if (state.imageCache.has(src)) {
      return state.imageCache.get(src);
    }
    const image = new Image();
    image.addEventListener("load", () => drawPreviewAndMetrics(), { once: true });
    image.src = src;
    state.imageCache.set(src, image);
    return image;
  }

  function applyMono(ctx, width, height, render) {
    const threshold = clamp(Number(render.threshold) || 156, 0, 255);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    if (render.dither === "floyd") {
      const gray = new Float32Array(width * height);
      for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
        let value = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        if (render.invert) {
          value = 255 - value;
        }
        gray[pixel] = value;
      }

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = y * width + x;
          const oldValue = gray[index];
          const newValue = oldValue < threshold ? 0 : 255;
          const error = oldValue - newValue;
          gray[index] = newValue;
          distributeError(gray, width, height, x + 1, y, error * 7 / 16);
          distributeError(gray, width, height, x - 1, y + 1, error * 3 / 16);
          distributeError(gray, width, height, x, y + 1, error * 5 / 16);
          distributeError(gray, width, height, x + 1, y + 1, error * 1 / 16);
        }
      }

      for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
        const value = gray[pixel] < 128 ? 0 : 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
    } else {
      for (let i = 0; i < data.length; i += 4) {
        let value = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        if (render.invert) {
          value = 255 - value;
        }
        const mono = value < threshold ? 0 : 255;
        data[i] = mono;
        data[i + 1] = mono;
        data[i + 2] = mono;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function distributeError(gray, width, height, x, y, error) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }
    gray[y * width + x] += error;
  }

  function packCanvas(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const { data } = ctx.getImageData(0, 0, width, height);
    const stride = Math.ceil(width / 8);
    const bytes = new Uint8Array(stride * height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dataIndex = (y * width + x) * 4;
        const black = data[dataIndex] < 128;
        if (black) {
          bytes[y * stride + (x >> 3)] |= 1 << (7 - (x & 7));
        }
      }
    }

    const crc = crc32(bytes);
    return {
      bytes,
      meta: {
        schema: SCHEMA,
        width,
        height,
        format: "raw-1bpp-msb",
        bytes: bytes.length,
        crc32: crc
      }
    };
  }

  function renderPageBitmap(page) {
    const canvas = document.createElement("canvas");
    renderPageToCanvas(page, canvas);
    return packCanvas(canvas);
  }

  function buildPackage() {
    const target = {
      ...state.model.target,
      width: Number(state.model.target.width),
      height: Number(state.model.target.height),
      color: "bw",
      bpp: 1,
      pixelOrder: "row-major",
      bitOrder: "msb",
      blackBit: 1
    };
    const pages = state.model.pages.map((page, index) => {
      const bitmap = renderPageBitmap(page);
      return {
        id: page.id,
        title: page.title || `Page ${index + 1}`,
        kind: page.kind,
        order: index,
        durationSec: page.durationSec || 0,
        blocks: buildBlocks(page),
        bitmap: {
          ...bitmap.meta,
          encoding: "base64",
          data: bytesToBase64(bitmap.bytes)
        }
      };
    });

    return {
      schema: SCHEMA,
      packageId: createPackageId(),
      createdAt: new Date().toISOString(),
      tool: {
        name: "InkScreen Studio",
        version: APP_VERSION
      },
      target,
      render: { ...state.model.render },
      pages
    };
  }

  function buildBlocks(page) {
    const heading = { type: "heading", text: page.title || "" };
    if (page.kind === "agenda") {
      return [heading, { type: "agenda", items: parseAgendaLines(page.body) }];
    }
    if (page.kind === "checklist") {
      return [heading, { type: "checklist", items: parseChecklistLines(page.body) }];
    }
    if (page.kind === "quote") {
      return [heading, { type: "quote", text: page.body || "", by: page.footer || "" }];
    }
    if (page.kind === "image") {
      return [
        heading,
        { type: "image", name: page.imageDataUrl ? "uploaded-image" : "placeholder", fit: "contain" },
        { type: "paragraph", text: page.body || "" }
      ];
    }
    return [
      heading,
      ...parseMetricLines(page.body).map((metric) => ({ type: "metric", ...metric }))
    ];
  }

  function parseMetricLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
        if (parts.length >= 2) {
          return { label: parts[0], value: parts[1], note: parts.slice(2).join(" / ") };
        }
        const tokens = line.split(/\s+/);
        return {
          label: tokens.shift() || "项目",
          value: tokens.shift() || "",
          note: tokens.join(" ")
        };
      });
  }

  function parseAgendaLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((part) => part.trim());
        if (parts.length >= 2) {
          return { time: parts[0], text: parts[1], meta: parts.slice(2).join(" / ") };
        }
        const match = line.match(/^(\S+)\s+(.+)$/);
        return match
          ? { time: match[1], text: match[2], meta: "" }
          : { time: "--:--", text: line, meta: "" };
      });
  }

  function parseChecklistLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(?:[-*]\s*)?\[(x|X| )\]\s*(.+)$/);
        if (match) {
          return { checked: match[1].toLowerCase() === "x", text: match[2] };
        }
        const loose = line.match(/^(x\s+|done\s+)?(.+)$/i);
        return { checked: Boolean(loose?.[1]), text: loose?.[2] || line };
      });
  }

  async function connectBle() {
    if (!navigator.bluetooth) {
      logLine("当前浏览器不支持 Web Bluetooth，建议用 Android Chrome 打开 GitHub Pages。");
      return;
    }

    try {
      logLine("正在选择蓝牙设备...");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID]
      });
      device.addEventListener("gattserverdisconnected", handleBleDisconnected);

      logLine(`正在连接：${device.name || "ESP32-C3"}`);
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const control = await service.getCharacteristic(CONTROL_UUID);
      const data = await service.getCharacteristic(DATA_UUID);

      state.ble.device = device;
      state.ble.server = server;
      state.ble.control = control;
      state.ble.data = data;

      try {
        state.ble.status = await service.getCharacteristic(STATUS_UUID);
        await state.ble.status.startNotifications();
        state.ble.status.addEventListener("characteristicvaluechanged", handleBleStatus);
      } catch {
        state.ble.status = null;
      }

      updateConnectionUi();
      logLine("蓝牙已连接，可以发送内容包或当前位图。");
    } catch (error) {
      logLine(`蓝牙连接失败：${error.message}`);
      updateConnectionUi();
    }
  }

  function handleBleDisconnected() {
    state.ble.server = null;
    state.ble.control = null;
    state.ble.data = null;
    state.ble.status = null;
    updateConnectionUi();
    logLine("蓝牙已断开。");
  }

  function handleBleStatus(event) {
    const value = event.target.value;
    const text = new TextDecoder().decode(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    if (text) {
      logLine(`设备：${text}`);
    }
  }

  async function sendBlePackage() {
    try {
      assertBleConnected();
      const packageText = JSON.stringify(buildPackage());
      const bytes = new TextEncoder().encode(packageText);
      await writeControl({ cmd: "package_begin", schema: SCHEMA, bytes: bytes.length });
      await writeChunks(bytes, "内容包");
      await writeControl({ cmd: "package_end", crc32: crc32(bytes) });
      logLine(`内容包已通过蓝牙发送：${bytes.length} B`);
    } catch (error) {
      logLine(`蓝牙发送失败：${error.message}`);
    }
  }

  async function sendBleBitmap() {
    try {
      assertBleConnected();
      renderPageToCanvas(getActivePage(), el.previewCanvas);
      const bitmap = packCanvas(el.previewCanvas);
      await writeControl({
        cmd: "bitmap_begin",
        width: bitmap.meta.width,
        height: bitmap.meta.height,
        format: bitmap.meta.format,
        bytes: bitmap.bytes.length
      });
      await writeChunks(bitmap.bytes, "当前位图");
      await writeControl({ cmd: "bitmap_end", crc32: bitmap.meta.crc32 });
      logLine(`当前位图已通过蓝牙发送：${bitmap.bytes.length} B`);
    } catch (error) {
      logLine(`蓝牙发送失败：${error.message}`);
    }
  }

  async function sendWifiConfig() {
    try {
      assertBleConnected();
      await writeControl({
        cmd: "wifi_set",
        ssid: el.ssidInput.value.trim(),
        password: el.passwordInput.value
      });
      logLine("Wi-Fi 配置已写入设备。");
    } catch (error) {
      logLine(`写入 Wi-Fi 配置失败：${error.message}`);
    }
  }

  async function sendWifiPackage() {
    try {
      const url = makeDeviceUrl("/api/v1/inkscreen/package");
      warnIfMixedContent(url);
      const packageText = JSON.stringify(buildPackage());
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-InkScreen-Schema": SCHEMA
        },
        body: packageText
      });
      await assertHttpOk(response);
      logLine(`Wi-Fi 内容包已发送：${new TextEncoder().encode(packageText).length} B`);
    } catch (error) {
      logLine(`Wi-Fi 发送失败：${error.message}`);
    }
  }

  async function sendWifiBitmap() {
    try {
      const url = makeDeviceUrl("/api/display/bitmap");
      warnIfMixedContent(url);
      renderPageToCanvas(getActivePage(), el.previewCanvas);
      const bitmap = packCanvas(el.previewCanvas);
      const metaHeader = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(bitmap.meta)));
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-InkScreen-Meta": metaHeader
        },
        body: bitmap.bytes
      });
      await assertHttpOk(response);
      logLine(`Wi-Fi 当前位图已发送：${bitmap.bytes.length} B`);
    } catch (error) {
      logLine(`Wi-Fi 发送失败：${error.message}`);
    }
  }

  async function assertHttpOk(response) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`${response.status} ${response.statusText}${text ? `: ${text}` : ""}`);
    }
  }

  function makeDeviceUrl(path) {
    const value = el.deviceIpInput.value.trim();
    if (!value) {
      throw new Error("请先填写设备地址。");
    }
    const base = /^https?:\/\//i.test(value) ? value : `http://${value}`;
    const url = new URL(base);
    url.pathname = path;
    return url.toString();
  }

  function warnIfMixedContent(url) {
    if (location.protocol === "https:" && url.startsWith("http://")) {
      logLine("提示：HTTPS 页面直连 HTTP 局域网设备可能被浏览器拦截。BLE 上传不受影响；Wi-Fi 直传需要设备支持 HTTPS/CORS，或从本地 HTTP 页面打开工具。");
    }
  }

  async function writeControl(object) {
    const bytes = new TextEncoder().encode(JSON.stringify(object));
    await writeCharacteristic(state.ble.control, bytes);
  }

  async function writeChunks(bytes, label) {
    for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
      const chunk = bytes.slice(offset, offset + CHUNK_SIZE);
      await writeCharacteristic(state.ble.data, chunk);
      if (offset % (CHUNK_SIZE * 12) === 0) {
        logLine(`${label} ${Math.min(offset + chunk.length, bytes.length)} / ${bytes.length} B`);
      }
      await sleep(6);
    }
  }

  async function writeCharacteristic(characteristic, bytes) {
    const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    if (typeof characteristic.writeValueWithResponse === "function") {
      await characteristic.writeValueWithResponse(view);
      return;
    }
    await characteristic.writeValue(view);
  }

  function assertBleConnected() {
    if (!state.ble.control || !state.ble.data) {
      throw new Error("请先连接蓝牙设备。");
    }
  }

  function updateConnectionUi() {
    const connected = Boolean(state.ble.control && state.ble.data);
    el.connectionStatus.textContent = connected ? "蓝牙已连接" : "未连接";
    el.connectionStatus.classList.toggle("is-connected", connected);
    el.blePackageButton.disabled = !connected;
    el.bleBitmapButton.disabled = !connected;
    el.wifiConfigButton.disabled = !connected;
    if (!navigator.bluetooth) {
      el.bleConnectButton.disabled = true;
      el.bleConnectButton.textContent = "浏览器不支持蓝牙";
    }
  }

  function downloadPackage() {
    const packageText = JSON.stringify(buildPackage(), null, 2);
    downloadBlob(new Blob([packageText], { type: "application/json;charset=utf-8" }), `${createPackageId()}.json`);
    logLine("已导出内容包 JSON。");
  }

  function downloadPng() {
    renderPageToCanvas(getActivePage(), el.previewCanvas);
    el.previewCanvas.toBlob((blob) => {
      if (!blob) {
        logLine("PNG 导出失败。");
        return;
      }
      downloadBlob(blob, `${getActivePage().title || "inkscreen"}.png`);
      logLine("已导出当前页面 PNG。");
    }, "image/png");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) {
      binary += String.fromCharCode(...bytes.subarray(i, i + step));
    }
    return btoa(binary);
  }

  function bytesToBase64Url(bytes) {
    return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
  }

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let value = i;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      table[i] = value >>> 0;
    }
    return table;
  })();

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        model: state.model,
        activePageId: state.activePageId
      }));
    } catch {
      logLine("本地保存失败，可能是图片太大或浏览器存储已满。");
    }
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.activePageId) {
        state.activePageId = parsed.activePageId;
      }
      return parsed?.model || null;
    } catch {
      return null;
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      logLine("离线缓存注册失败，不影响在线使用。");
    });
  }

  function logLine(message) {
    const time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    state.logLines.unshift(`[${time}] ${message}`);
    state.logLines = state.logLines.slice(0, 80);
    el.logOutput.textContent = state.logLines.join("\n");
  }

  function createId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function createPackageId() {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    return `ink_${stamp}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }
})();
