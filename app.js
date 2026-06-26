(() => {
  "use strict";

  const APP_VERSION = "0.3.1";
  const STORAGE_KEY = "inkscreen.studio.v2";
  const SCHEMA = "inkscreen.package.v1";
  const CHUNK_SIZE = 180;
  const RASTER_SCALE = 3;
  const FONT_STACK = '"Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, sans-serif';

  const SERVICE_UUID = "9f2a0001-6f37-4f1e-9a5e-1b5c00000001";
  const CONTROL_UUID = "9f2a0002-6f37-4f1e-9a5e-1b5c00000001";
  const DATA_UUID = "9f2a0003-6f37-4f1e-9a5e-1b5c00000001";
  const STATUS_UUID = "9f2a0004-6f37-4f1e-9a5e-1b5c00000001";

  const KIND_LABELS = {
    dashboard: "看板",
    agenda: "日程",
    checklist: "清单",
    quote: "便签",
    image: "图片",
    weather: "天气",
    focus: "专注",
    countdown: "倒计时",
    habit: "习惯",
    notice: "提醒",
    device: "设备",
    word: "单词"
  };

  const TEMPLATE_ORDER = [
    "today",
    "schedule",
    "weather",
    "focus",
    "countdown",
    "habit",
    "quote",
    "image",
    "notice",
    "device",
    "word"
  ];

  const TEMPLATE_DEFS = {
    today: {
      label: "今日看板",
      kind: "dashboard",
      title: "今日看板",
      footer: "InkScreen",
      defaults: {
        weather: "晴 26C",
        todo: "3",
        next: "10:10 电路分析",
        battery: "86%",
        note: "把最重要的一件事先做掉"
      },
      fields: [
        field("weather", "天气", "text"),
        field("todo", "待办", "text"),
        field("next", "下一项", "text", true),
        field("battery", "电量", "text"),
        field("note", "提醒", "text", true)
      ]
    },
    schedule: {
      label: "课程/日程",
      kind: "agenda",
      title: "课程表",
      footer: "旋钮翻页",
      defaults: {
        items: "08:00 | 高等数学 | A201\n10:10 | 电路分析 | B105\n14:00 | 项目制作 | 实验室\n19:30 | 跑步 30 min"
      },
      fields: [field("items", "日程", "textarea", true)]
    },
    weather: {
      label: "天气卡片",
      kind: "weather",
      title: "天气",
      footer: "local",
      defaults: {
        city: "杭州",
        condition: "多云",
        temp: "26C",
        highLow: "22 / 29C",
        humidity: "68%",
        wind: "东风 2级",
        advice: "带伞，晚间降温"
      },
      fields: [
        field("city", "城市", "text"),
        field("condition", "天气", "text"),
        field("temp", "温度", "text"),
        field("highLow", "高低温", "text"),
        field("humidity", "湿度", "text"),
        field("wind", "风", "text"),
        field("advice", "建议", "text", true)
      ]
    },
    focus: {
      label: "番茄专注",
      kind: "focus",
      title: "专注",
      footer: "Focus",
      defaults: {
        task: "画 ESP32 原理图",
        minutes: "25",
        progress: "40",
        next: "休息 5 min"
      },
      fields: [
        field("task", "任务", "text", true),
        field("minutes", "分钟", "number"),
        field("progress", "进度 %", "number"),
        field("next", "下一步", "text", true)
      ]
    },
    countdown: {
      label: "倒计时",
      kind: "countdown",
      title: "倒计时",
      footer: "D-DAY",
      defaults: {
        event: "PCB 下单",
        left: "7",
        date: "2026-07-02",
        note: "今天确认 BOM 和封装"
      },
      fields: [
        field("event", "事件", "text", true),
        field("left", "剩余天数", "number"),
        field("date", "日期", "text"),
        field("note", "备注", "text", true)
      ]
    },
    habit: {
      label: "习惯打卡",
      kind: "habit",
      title: "习惯",
      footer: "Daily",
      defaults: {
        habits: "早起 | 1\n阅读 | 1\n运动 | 0\n复盘 | 0",
        streak: "连续 5 天"
      },
      fields: [
        field("habits", "习惯", "textarea", true),
        field("streak", "连续", "text")
      ]
    },
    quote: {
      label: "一句话",
      kind: "quote",
      title: "便签",
      footer: "InkScreen",
      defaults: {
        quote: "把今天留一点给自己。",
        by: "InkScreen"
      },
      fields: [
        field("quote", "内容", "textarea", true),
        field("by", "署名", "text")
      ]
    },
    image: {
      label: "图片相框",
      kind: "image",
      title: "图片",
      footer: "Photo",
      defaults: {
        caption: "上传图片后自动适配显示区域。"
      },
      fields: [field("caption", "说明", "text", true)]
    },
    notice: {
      label: "桌面提醒",
      kind: "notice",
      title: "提醒",
      footer: "Memo",
      defaults: {
        tag: "重要",
        message: "18:30 前把墨水屏外壳尺寸确认掉。",
        action: "完成后同步 PCB 安装孔"
      },
      fields: [
        field("tag", "标签", "text"),
        field("message", "内容", "textarea", true),
        field("action", "动作", "text", true)
      ]
    },
    device: {
      label: "设备状态",
      kind: "device",
      title: "设备",
      footer: "ESP32-C3",
      defaults: {
        wifi: "LiziLab",
        ip: "192.168.3.42",
        battery: "86%",
        status: "在线",
        updated: "刚刚同步"
      },
      fields: [
        field("wifi", "Wi-Fi", "text"),
        field("ip", "IP", "text"),
        field("battery", "电量", "text"),
        field("status", "状态", "text"),
        field("updated", "更新", "text", true)
      ]
    },
    word: {
      label: "单词卡",
      kind: "word",
      title: "Daily Word",
      footer: "word",
      defaults: {
        word: "clarity",
        phonetic: "/klaereti/",
        meaning: "清晰；明确",
        example: "Build with clarity."
      },
      fields: [
        field("word", "单词", "text"),
        field("phonetic", "音标", "text"),
        field("meaning", "含义", "text", true),
        field("example", "例句", "text", true)
      ]
    }
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

  function field(name, label, type = "text", wide = false) {
    return { name, label, type, wide };
  }

  function init() {
    bindElements();
    populateTemplateSelect();
    state.model = restoreState() || createDefaultModel();
    const restoredActiveId = state.activePageId;
    normalizeModel();
    state.activePageId = state.model.pages.some((page) => page.id === restoredActiveId)
      ? restoredActiveId
      : state.model.pages[0].id;
    bindEvents();
    syncFormFromState();
    renderPageList();
    updateConnectionUi();
    drawPreviewAndMetrics();
    registerServiceWorker();
    logLine(`就绪：v${APP_VERSION} 已使用模板参数和高清二值化渲染。`);
  }

  function bindElements() {
    const ids = [
      "connectionStatus",
      "addPageButton",
      "duplicatePageButton",
      "deletePageButton",
      "pageList",
      "pageTitleInput",
      "templateInput",
      "sampleButton",
      "paramEditor",
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
  }

  function populateTemplateSelect() {
    el.templateInput.replaceChildren();
    TEMPLATE_ORDER.forEach((template) => {
      const def = TEMPLATE_DEFS[template];
      const option = document.createElement("option");
      option.value = template;
      option.textContent = def.label;
      el.templateInput.append(option);
    });
  }

  function bindEvents() {
    el.addPageButton.addEventListener("click", addPage);
    el.duplicatePageButton.addEventListener("click", duplicatePage);
    el.deletePageButton.addEventListener("click", deletePage);
    el.sampleButton.addEventListener("click", fillSampleParams);

    el.pageTitleInput.addEventListener("input", () => {
      updateActivePage({ title: el.pageTitleInput.value });
    });
    el.templateInput.addEventListener("change", () => setTemplate(el.templateInput.value));
    el.bodyInput.addEventListener("input", handleBodyInput);
    el.footerInput.addEventListener("input", () => {
      updateActivePage({ footer: el.footerInput.value });
    });
    el.imageInput.addEventListener("change", handleImageUpload);

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
        threshold: 150,
        dither: "threshold",
        invert: false,
        fontScale: 1,
        rasterScale: RASTER_SCALE
      },
      pages: [
        createPage("today", { id: "page_home" }),
        createPage("schedule", { id: "page_agenda" }),
        createPage("weather", { id: "page_weather" }),
        createPage("focus", { id: "page_focus" }),
        createPage("countdown", { id: "page_countdown" }),
        createPage("habit", { id: "page_habit" }),
        createPage("word", { id: "page_word" }),
        createPage("notice", { id: "page_notice" })
      ]
    };
  }

  function createPage(template = "today", seed = {}) {
    const normalized = normalizeTemplate(template);
    const def = TEMPLATE_DEFS[normalized];
    const params = { ...def.defaults, ...(seed.params || {}) };
    return {
      id: seed.id || createId("page"),
      title: seed.title || def.title,
      kind: def.kind,
      template: normalized,
      durationSec: seed.durationSec || 0,
      params,
      body: seed.body ?? serializeParams(normalized, params),
      footer: seed.footer ?? def.footer,
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
      threshold: 150,
      dither: "threshold",
      invert: false,
      fontScale: 1,
      rasterScale: RASTER_SCALE,
      ...(state.model.render || {})
    };
    if (!Array.isArray(state.model.pages) || state.model.pages.length === 0) {
      state.model.pages = [createPage("today")];
    }
    state.model.pages = state.model.pages.map((page) => normalizePage(page));
  }

  function normalizePage(page) {
    const template = normalizeTemplate(page.template || page.kind);
    const def = TEMPLATE_DEFS[template];
    const migratedParams = page.params
      ? { ...def.defaults, ...page.params }
      : { ...def.defaults, ...paramsFromBody(template, page.body || "") };
    return {
      ...createPage(template),
      ...page,
      id: page.id || createId("page"),
      title: page.title || def.title,
      kind: def.kind,
      template,
      params: migratedParams,
      body: page.body || serializeParams(template, migratedParams),
      footer: page.footer ?? def.footer
    };
  }

  function normalizeTemplate(value) {
    if (TEMPLATE_DEFS[value]) {
      return value;
    }
    const legacyMap = {
      dashboard: "today",
      agenda: "schedule",
      checklist: "habit",
      quote: "quote",
      image: "image"
    };
    return legacyMap[value] || "today";
  }

  function getActivePage() {
    return state.model.pages.find((page) => page.id === state.activePageId) || state.model.pages[0];
  }

  function getPageParams(page) {
    const def = TEMPLATE_DEFS[normalizeTemplate(page.template)];
    return { ...def.defaults, ...(page.params || {}) };
  }

  function syncFormFromState() {
    const page = getActivePage();
    el.pageTitleInput.value = page.title || "";
    el.templateInput.value = normalizeTemplate(page.template);
    el.bodyInput.value = page.body || "";
    el.footerInput.value = page.footer || "";
    el.widthInput.value = state.model.target.width;
    el.heightInput.value = state.model.target.height;
    el.ditherInput.value = state.model.render.dither;
    el.thresholdInput.value = state.model.render.threshold;
    el.invertInput.checked = Boolean(state.model.render.invert);
    const presetKey = `${state.model.target.width}x${state.model.target.height}`;
    el.presetInput.value = PRESETS.has(presetKey) ? presetKey : "custom";
    renderParamEditor();
    syncTemplateVisibility();
  }

  function syncTemplateVisibility() {
    const page = getActivePage();
    el.imageField.classList.toggle("is-hidden", normalizeTemplate(page.template) !== "image");
  }

  function renderParamEditor() {
    const page = getActivePage();
    const template = normalizeTemplate(page.template);
    const def = TEMPLATE_DEFS[template];
    const params = getPageParams(page);
    el.paramEditor.replaceChildren();

    def.fields.forEach((config) => {
      const label = document.createElement("label");
      label.className = `field${config.wide ? " wide" : ""}`;

      const title = document.createElement("span");
      title.textContent = config.label;

      const input = createParamInput(config, params[config.name]);
      input.dataset.param = config.name;
      input.addEventListener("input", handleParamInput);
      input.addEventListener("change", handleParamInput);

      label.append(title, input);
      el.paramEditor.append(label);
    });
  }

  function createParamInput(config, value) {
    let input;
    if (config.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
      input.spellcheck = false;
    } else {
      input = document.createElement("input");
      input.type = config.type === "number" ? "number" : "text";
      if (input.type === "number") {
        input.step = "1";
      }
    }
    input.value = value ?? "";
    return input;
  }

  function handleParamInput(event) {
    const page = getActivePage();
    const key = event.target.dataset.param;
    page.params = { ...getPageParams(page), [key]: event.target.value };
    page.body = serializeParams(page.template, page.params);
    el.bodyInput.value = page.body;
    renderPageList();
    drawPreviewAndMetrics();
    persistState();
  }

  function handleBodyInput() {
    const page = getActivePage();
    page.body = el.bodyInput.value;
    page.params = { ...getPageParams(page), ...paramsFromBody(page.template, page.body) };
    renderParamEditor();
    renderPageList();
    drawPreviewAndMetrics();
    persistState();
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
      kind.textContent = TEMPLATE_DEFS[normalizeTemplate(page.template)].label;

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
    const nextTemplate = TEMPLATE_ORDER[(state.model.pages.length + 1) % TEMPLATE_ORDER.length];
    const page = createPage(nextTemplate, {
      title: `${TEMPLATE_DEFS[nextTemplate].title} ${state.model.pages.length + 1}`
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

  function setTemplate(template) {
    const page = getActivePage();
    const normalized = normalizeTemplate(template);
    const def = TEMPLATE_DEFS[normalized];
    page.template = normalized;
    page.kind = def.kind;
    page.title = page.title || def.title;
    page.footer = page.footer || def.footer;
    page.params = { ...def.defaults, ...paramsFromBody(normalized, page.body || "") };
    page.body = serializeParams(normalized, page.params);
    syncFormFromState();
    renderPageList();
    drawPreviewAndMetrics();
    persistState();
  }

  function fillSampleParams() {
    const page = getActivePage();
    const def = TEMPLATE_DEFS[normalizeTemplate(page.template)];
    page.params = { ...def.defaults };
    page.title = def.title;
    page.footer = def.footer;
    page.body = serializeParams(page.template, page.params);
    syncFormFromState();
    renderPageList();
    drawPreviewAndMetrics();
    persistState();
    logLine(`已填入 ${def.label} 示例。`);
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
      page.template = "image";
      page.kind = "image";
      page.title = page.title || file.name.replace(/\.[^.]+$/, "");
      syncFormFromState();
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
    const scale = clamp(Math.round(render.rasterScale || RASTER_SCALE), 2, 4);

    const source = document.createElement("canvas");
    source.width = width * scale;
    source.height = height * scale;
    const ctx = source.getContext("2d", { willReadFrequently: true });
    ctx.save();
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#111111";
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 1;
    drawPage(ctx, page, width, height, getCanvasSizes(width, height));
    ctx.restore();

    canvas.width = width;
    canvas.height = height;
    const previewScale = getPreviewScale(width, height);
    canvas.style.width = `${Math.round(width * previewScale)}px`;
    canvas.style.height = "auto";
    rasterizeSourceToCanvas(source, canvas, width, height, scale, render);
  }

  function getPreviewScale(width, height) {
    const maxSide = Math.max(width, height);
    if (maxSide <= 260) {
      return 2;
    }
    if (maxSide <= 320) {
      return 1.7;
    }
    if (maxSide <= 420) {
      return 1.35;
    }
    return 1;
  }

  function drawPage(ctx, page, width, height, size) {
    const template = normalizeTemplate(page.template);
    if (template === "schedule") {
      drawAgenda(ctx, page, width, height, size);
    } else if (template === "habit") {
      drawHabit(ctx, page, width, height, size);
    } else if (template === "quote") {
      drawQuote(ctx, page, width, height, size);
    } else if (template === "image") {
      drawImagePage(ctx, page, width, height, size);
    } else if (template === "weather") {
      drawWeather(ctx, page, width, height, size);
    } else if (template === "focus") {
      drawFocus(ctx, page, width, height, size);
    } else if (template === "countdown") {
      drawCountdown(ctx, page, width, height, size);
    } else if (template === "notice") {
      drawNotice(ctx, page, width, height, size);
    } else if (template === "device") {
      drawDevice(ctx, page, width, height, size);
    } else if (template === "word") {
      drawWord(ctx, page, width, height, size);
    } else {
      drawToday(ctx, page, width, height, size);
    }
    drawFooter(ctx, page, width, height, size);
  }

  function getCanvasSizes(width, height) {
    const minSide = Math.min(width, height);
    const scale = state.model.render.fontScale || 1;
    return {
      margin: Math.max(7, Math.round(minSide * 0.07)),
      gap: Math.max(4, Math.round(minSide * 0.036)),
      title: Math.max(15, Math.round(minSide * 0.15 * scale)),
      body: Math.max(12, Math.round(minSide * 0.105 * scale)),
      small: Math.max(9, Math.round(minSide * 0.082 * scale)),
      micro: Math.max(8, Math.round(minSide * 0.07 * scale))
    };
  }

  function drawHeader(ctx, page, width, size) {
    const y = size.margin + size.title;
    setFont(ctx, 800, size.title);
    drawFitText(ctx, page.title || "InkScreen", size.margin, y, width - size.margin * 2);
    ctx.beginPath();
    ctx.moveTo(size.margin, snap(y + size.gap));
    ctx.lineTo(width - size.margin, snap(y + size.gap));
    ctx.stroke();
    return y + size.gap * 2;
  }

  function drawToday(ctx, page, width, height, size) {
    const yStart = drawHeader(ctx, page, width, size);
    const params = getPageParams(page);
    const contentX = size.margin;
    const contentY = yStart;
    const contentW = width - size.margin * 2;
    const bottomY = height - size.margin - size.small * 1.7;
    const contentH = Math.max(40, bottomY - contentY);

    if (width < height * 1.05) {
      const metrics = [
        { label: "天气", value: params.weather, note: params.note },
        { label: "待办", value: params.todo, note: "items" },
        { label: "下一项", value: params.next, note: "" },
        { label: "电量", value: params.battery, note: "battery" }
      ];
      drawMetricGrid(ctx, metrics, contentX, contentY, contentW, contentH, size);
      return;
    }

    const weather = splitWeather(params.weather);
    const leftW = Math.max(72, Math.round(contentW * 0.38));
    const rightX = contentX + leftW + size.gap;
    const rightW = contentW - leftW - size.gap;
    const nextH = Math.max(size.body + 9, Math.round(contentH * 0.26));
    const topH = contentH - nextH - size.gap;

    setFont(ctx, 800, size.small);
    drawFitText(ctx, "天气", contentX + size.gap, contentY + size.small + 3, leftW - size.gap * 2);
    setFont(ctx, 950, Math.min(31, Math.max(24, Math.round(topH * 0.48))));
    drawFitText(ctx, weather.temp, contentX + size.gap, contentY + topH - size.small - 4, leftW - size.gap * 2, { minSize: 19 });
    setFont(ctx, 750, size.micro);
    drawFitText(ctx, weather.condition || params.note, contentX + size.gap, contentY + topH - 4, leftW - size.gap * 2);

    ctx.beginPath();
    ctx.moveTo(snap(contentX + leftW + Math.round(size.gap / 2)), snap(contentY + 1));
    ctx.lineTo(snap(contentX + leftW + Math.round(size.gap / 2)), snap(contentY + topH - 1));
    ctx.stroke();

    const statusLines = [
      `待办 ${params.todo}`,
      `电量 ${params.battery}`
    ];
    const statusLineH = Math.max(size.body + 4, Math.floor(topH / Math.max(2, statusLines.length)));
    statusLines.forEach((line, index) => {
      const lineY = contentY + Math.round(statusLineH * index + (statusLineH + size.body) / 2);
      setFont(ctx, index === 0 ? 880 : 780, index === 0 ? size.body + 1 : size.small);
      drawFitText(ctx, line, rightX, lineY, rightW, { minSize: 9 });
    });

    const nextY = contentY + topH + size.gap;
    strokeRect(ctx, contentX, nextY, contentW, nextH);
    setFont(ctx, 750, size.micro);
    drawFitText(ctx, "下一项", contentX + size.gap, nextY + size.micro + 3, Math.max(34, contentW * 0.2));
    setFont(ctx, 850, size.body);
    drawFitText(ctx, params.next, contentX + Math.max(42, contentW * 0.22), nextY + Math.round((nextH + size.body) / 2) - 1, contentW - Math.max(48, contentW * 0.24), { minSize: 10 });
  }

  function drawMetricGrid(ctx, metrics, x, y, width, height, size) {
    const columns = width > height * 1.2 ? 2 : 1;
    const minCellH = Math.max(28, size.body + size.small + 9);
    const maxRows = Math.max(1, Math.floor((height + size.gap) / (minCellH + size.gap)));
    const visibleMetrics = metrics.slice(0, maxRows * columns);
    const rows = Math.ceil(visibleMetrics.length / columns) || 1;
    const cellW = (width - size.gap * (columns - 1)) / columns;
    const cellH = Math.max(24, (height - size.gap * (rows - 1)) / rows);
    visibleMetrics.forEach((metric, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cellX = x + col * (cellW + size.gap);
      const cellY = y + row * (cellH + size.gap);
      strokeRect(ctx, cellX, cellY, cellW, cellH);
      ctx.fillRect(Math.round(cellX), Math.round(cellY), Math.max(2, Math.round(size.gap * 0.55)), Math.round(cellH));
      setFont(ctx, 700, size.small);
      const valueSize = Math.max(size.body, Math.min(size.body + 5, Math.round(cellH * 0.34)));
      if (cellH < size.small + valueSize + 12) {
        setFont(ctx, 850, Math.max(size.body, Math.round(cellH * 0.36)));
        drawFitText(ctx, `${metric.label} ${metric.value}`, cellX + size.gap, cellY + Math.round((cellH + size.body) / 2) + 1, cellW - size.gap * 2, { minSize: 10 });
        return;
      }
      drawFitText(ctx, metric.label, cellX + size.gap, cellY + size.small + 3, cellW - size.gap * 2);
      setFont(ctx, 900, valueSize);
      const valueY = metric.note && cellH >= size.body + size.small + 15
        ? cellY + cellH - size.small - 2
        : cellY + Math.round((cellH + valueSize) / 2) + 2;
      drawFitText(ctx, metric.value, cellX + size.gap, valueY, cellW - size.gap * 2, { minSize: 10 });
      if (metric.note && cellH >= size.body + size.small + 15) {
        setFont(ctx, 600, size.micro);
        ctx.fillStyle = "#555555";
        drawFitText(ctx, metric.note, cellX + size.gap, cellY + cellH - 3, cellW - size.gap * 2);
        ctx.fillStyle = "#111111";
      }
    });
  }

  function drawKeyValueBox(ctx, label, value, x, y, width, height, size) {
    strokeRect(ctx, x, y, width, height);
    const valueSize = Math.max(size.body + 1, Math.round(height * 0.34));
    if (height < size.micro + valueSize + 11) {
      setFont(ctx, 850, Math.max(size.body, Math.round(height * 0.38)));
      drawFitText(ctx, `${label} ${value}`, x + size.gap, y + Math.round((height + size.body) / 2) + 1, width - size.gap * 2, { minSize: 10 });
      return;
    }
    setFont(ctx, 750, size.micro);
    drawFitText(ctx, label, x + size.gap, y + size.micro + 3, width - size.gap * 2);
    setFont(ctx, 900, valueSize);
    drawFitText(ctx, value, x + size.gap, y + height - 5, width - size.gap * 2, { minSize: 10 });
  }

  function splitWeather(value) {
    const text = String(value || "").trim();
    const parts = text.split(/\s+/).filter(Boolean);
    const tempIndex = parts.findIndex((part) => /\d/.test(part));
    if (tempIndex >= 0) {
      return {
        condition: parts.filter((_, index) => index !== tempIndex).join(" "),
        temp: parts[tempIndex]
      };
    }
    return { condition: "", temp: text || "--" };
  }

  function drawAgenda(ctx, page, width, height, size) {
    let y = drawHeader(ctx, page, width, size);
    const items = parseAgendaLines(getPageParams(page).items || page.body).slice(0, 5);
    const bottomLimit = height - size.margin - size.small * 1.8;
    const rowH = Math.max(size.body + 8, Math.floor((bottomLimit - y) / Math.max(1, items.length)));
    const timeW = Math.min(Math.max(44, width * 0.25), 72);

    items.forEach((item) => {
      if (y + rowH > bottomLimit + 2) {
        return;
      }
      strokeRect(ctx, size.margin, y, width - size.margin * 2, rowH - 2);
      setFont(ctx, 900, size.body);
      drawFitText(ctx, item.time, size.margin + size.gap, y + size.body + 3, timeW - size.gap);
      setFont(ctx, 800, size.body);
      drawFitText(ctx, item.text, size.margin + timeW, y + size.body + 3, width - size.margin * 2 - timeW - size.gap);
      if (item.meta) {
        setFont(ctx, 650, size.micro);
        ctx.fillStyle = "#555555";
        drawFitText(ctx, item.meta, size.margin + timeW, y + rowH - 5, width - size.margin * 2 - timeW - size.gap);
        ctx.fillStyle = "#111111";
      }
      y += rowH;
    });
  }

  function drawHabit(ctx, page, width, height, size) {
    let y = drawHeader(ctx, page, width, size);
    const params = getPageParams(page);
    const items = parseHabitLines(params.habits).slice(0, 5);
    const bottomLimit = height - size.margin - size.small * 1.8;
    const rowH = Math.max(size.body + 8, Math.floor((bottomLimit - y - size.body) / Math.max(1, items.length)));
    const box = clamp(Math.round(size.body * 0.9), 10, 17);

    setFont(ctx, 800, size.small);
    drawFitText(ctx, params.streak || "", size.margin, bottomLimit, width - size.margin * 2);

    items.forEach((item) => {
      if (y + rowH > bottomLimit) {
        return;
      }
      const boxY = y + Math.round((rowH - box) / 2);
      strokeRect(ctx, size.margin, boxY, box, box);
      if (item.checked) {
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(size.margin + 3, boxY + Math.round(box * 0.55));
        ctx.lineTo(size.margin + Math.round(box * 0.42), boxY + box - 3);
        ctx.lineTo(size.margin + box - 2, boxY + 3);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      setFont(ctx, 800, size.body);
      drawFitText(ctx, item.text, size.margin + box + size.gap, y + Math.round((rowH + size.body) / 2) - 2, width - size.margin * 2 - box - size.gap);
      y += rowH;
    });
  }

  function drawQuote(ctx, page, width, height, size) {
    let y = drawHeader(ctx, page, width, size);
    const params = getPageParams(page);
    const bodyFont = Math.max(size.body + 2, Math.round(Math.min(width, height) * 0.13));
    setFont(ctx, 850, bodyFont);
    y += size.gap;
    drawWrappedText(ctx, params.quote || "", size.margin, y, width - size.margin * 2, Math.round(bodyFont * 1.28), height - size.margin - size.small * 2);
    if (params.by) {
      setFont(ctx, 700, size.small);
      ctx.textAlign = "right";
      drawFitText(ctx, `- ${params.by}`, width - size.margin, height - size.margin - size.small * 1.2, width - size.margin * 2);
      ctx.textAlign = "left";
    }
  }

  function drawImagePage(ctx, page, width, height, size) {
    const params = getPageParams(page);
    const yStart = drawHeader(ctx, page, width, size);
    const bottomLimit = height - size.margin - size.small * 1.8;
    const areaX = size.margin;
    const areaY = yStart;
    const areaW = width - size.margin * 2;
    const areaH = Math.max(20, bottomLimit - yStart);
    strokeRect(ctx, areaX, areaY, areaW, areaH);

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

    setFont(ctx, 750, size.body);
    ctx.fillStyle = "#555555";
    drawWrappedText(ctx, params.caption || "", areaX + size.gap, areaY + size.body + size.gap, areaW - size.gap * 2, Math.round(size.body * 1.3), areaY + areaH - size.gap);
    ctx.fillStyle = "#111111";
  }

  function drawWeather(ctx, page, width, height, size) {
    const p = getPageParams(page);
    let y = drawHeader(ctx, page, width, size);
    setFont(ctx, 800, size.small);
    drawFitText(ctx, `${p.city}  ${p.condition}`, size.margin, y + size.small, width - size.margin * 2);
    setFont(ctx, 950, Math.max(31, Math.round(Math.min(width, height) * 0.34)));
    drawFitText(ctx, p.temp, size.margin, y + size.small + Math.max(31, Math.round(Math.min(width, height) * 0.34)), width * 0.58);
    const rightX = width * 0.58;
    setFont(ctx, 760, size.body);
    drawFitText(ctx, p.highLow, rightX, y + size.body + size.gap, width - rightX - size.margin);
    drawFitText(ctx, `湿度 ${p.humidity}`, rightX, y + size.body * 2.3 + size.gap, width - rightX - size.margin);
    drawFitText(ctx, p.wind, rightX, y + size.body * 3.6 + size.gap, width - rightX - size.margin);
    setFont(ctx, 800, size.small);
    drawFitText(ctx, p.advice, size.margin, height - size.margin - size.small * 1.5, width - size.margin * 2);
  }

  function drawFocus(ctx, page, width, height, size) {
    const p = getPageParams(page);
    let y = drawHeader(ctx, page, width, size);
    const progress = clamp(Number(p.progress) || 0, 0, 100);
    setFont(ctx, 850, size.body + 3);
    drawWrappedText(ctx, p.task, size.margin, y + size.body + 2, width - size.margin * 2, Math.round((size.body + 3) * 1.2), y + size.body * 3.2);
    setFont(ctx, 950, Math.max(30, Math.round(Math.min(width, height) * 0.3)));
    drawFitText(ctx, `${p.minutes}`, size.margin, height - size.margin - size.small * 2.2, width * 0.42);
    setFont(ctx, 850, size.body);
    drawFitText(ctx, "min", size.margin + width * 0.28, height - size.margin - size.small * 2.2, width * 0.18);
    const barX = width * 0.48;
    const barY = height - size.margin - size.body * 2.6;
    const barW = width - barX - size.margin;
    const barH = Math.max(10, size.body);
    strokeRect(ctx, barX, barY, barW, barH);
    ctx.fillRect(Math.round(barX), Math.round(barY), Math.round(barW * progress / 100), Math.round(barH));
    setFont(ctx, 760, size.small);
    drawFitText(ctx, `${progress}%  ${p.next}`, barX, barY + barH + size.small + 3, barW);
  }

  function drawCountdown(ctx, page, width, height, size) {
    const p = getPageParams(page);
    let y = drawHeader(ctx, page, width, size);
    setFont(ctx, 850, size.body + 2);
    drawFitText(ctx, p.event, size.margin, y + size.body + 3, width - size.margin * 2);
    const big = Math.max(42, Math.round(Math.min(width, height) * 0.42));
    setFont(ctx, 950, big);
    drawFitText(ctx, String(p.left), size.margin, y + big + size.body, width * 0.48);
    setFont(ctx, 850, size.body);
    drawFitText(ctx, "days", size.margin + width * 0.36, y + big + size.body - 4, width * 0.2);
    setFont(ctx, 760, size.small);
    drawFitText(ctx, p.date, width * 0.58, y + size.body * 2, width * 0.38);
    drawWrappedText(ctx, p.note, width * 0.58, y + size.body * 3.4, width * 0.36, Math.round(size.small * 1.25), height - size.margin - size.small * 2);
  }

  function drawNotice(ctx, page, width, height, size) {
    const p = getPageParams(page);
    let y = drawHeader(ctx, page, width, size);
    setFont(ctx, 850, size.small);
    strokeRect(ctx, size.margin, y, Math.min(52, width * 0.26), size.body + 4);
    drawFitText(ctx, p.tag, size.margin + size.gap, y + size.body, Math.min(52, width * 0.26) - size.gap * 2);
    y += size.body + size.gap * 2;
    setFont(ctx, 850, size.body + 2);
    drawWrappedText(ctx, p.message, size.margin, y + size.body, width - size.margin * 2, Math.round((size.body + 2) * 1.25), height - size.margin - size.body * 2.6);
    setFont(ctx, 760, size.small);
    drawFitText(ctx, p.action, size.margin, height - size.margin - size.small * 1.6, width - size.margin * 2);
  }

  function drawDevice(ctx, page, width, height, size) {
    const p = getPageParams(page);
    const yStart = drawHeader(ctx, page, width, size);
    const items = [
      { label: "Wi-Fi", value: p.wifi },
      { label: "IP", value: p.ip },
      { label: "电量", value: p.battery },
      { label: "状态", value: p.status },
      { label: "更新", value: p.updated }
    ];
    drawMetricGrid(ctx, items, size.margin, yStart, width - size.margin * 2, height - yStart - size.margin - size.small * 1.6, size);
  }

  function drawWord(ctx, page, width, height, size) {
    const p = getPageParams(page);
    let y = drawHeader(ctx, page, width, size);
    setFont(ctx, 950, Math.max(28, Math.round(Math.min(width, height) * 0.26)));
    drawFitText(ctx, p.word, size.margin, y + Math.max(28, Math.round(Math.min(width, height) * 0.26)), width - size.margin * 2);
    setFont(ctx, 700, size.small);
    drawFitText(ctx, p.phonetic, size.margin, y + Math.max(28, Math.round(Math.min(width, height) * 0.26)) + size.small + 5, width - size.margin * 2);
    setFont(ctx, 850, size.body);
    drawFitText(ctx, p.meaning, size.margin, height - size.margin - size.body * 2.2, width - size.margin * 2);
    setFont(ctx, 700, size.small);
    drawFitText(ctx, p.example, size.margin, height - size.margin - size.small * 1.1, width - size.margin * 2);
  }

  function drawFooter(ctx, page, width, height, size) {
    if (!page.footer) {
      return;
    }
    setFont(ctx, 720, size.micro);
    ctx.textAlign = "right";
    drawFitText(ctx, page.footer, width - size.margin, height - size.margin, width - size.margin * 2);
    ctx.textAlign = "left";
  }

  function setFont(ctx, weight, size) {
    ctx.__fontWeight = weight;
    ctx.__fontSize = Math.round(size);
    ctx.font = `${ctx.__fontWeight} ${ctx.__fontSize}px ${FONT_STACK}`;
  }

  function strokeRect(ctx, x, y, width, height) {
    ctx.strokeRect(snap(x), snap(y), Math.round(width), Math.round(height));
  }

  function snap(value) {
    return Math.round(value) + 0.5;
  }

  function drawFitText(ctx, text, x, y, maxWidth, options = {}) {
    const value = String(text || "");
    const initialWeight = ctx.__fontWeight || 700;
    const initialSize = ctx.__fontSize || 12;
    let activeSize = initialSize;
    const minSize = options.minSize || Math.max(9, Math.round(initialSize * 0.78));
    while (ctx.measureText(value).width > maxWidth && activeSize > minSize) {
      activeSize -= 1;
      setFont(ctx, initialWeight, activeSize);
    }
    if (ctx.measureText(value).width <= maxWidth) {
      ctx.fillText(value, x, y);
      if (activeSize !== initialSize) {
        setFont(ctx, initialWeight, initialSize);
      }
      return;
    }
    let clipped = value;
    while (clipped.length > 1 && ctx.measureText(`${clipped}...`).width > maxWidth) {
      clipped = clipped.slice(0, -1);
    }
    ctx.fillText(`${clipped}...`, x, y);
    if (activeSize !== initialSize) {
      setFont(ctx, initialWeight, initialSize);
    }
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

  function rasterizeSourceToCanvas(source, canvas, width, height, scale, render) {
    const sourceCtx = source.getContext("2d", { willReadFrequently: true });
    const sourceData = sourceCtx.getImageData(0, 0, source.width, source.height).data;
    const threshold = clamp(Number(render.threshold) || 150, 0, 255);
    const gray = new Float32Array(width * height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let sum = 0;
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            const sourceIndex = ((y * scale + sy) * source.width + (x * scale + sx)) * 4;
            sum += sourceData[sourceIndex] * 0.299 + sourceData[sourceIndex + 1] * 0.587 + sourceData[sourceIndex + 2] * 0.114;
          }
        }
        let value = sum / (scale * scale);
        if (render.invert) {
          value = 255 - value;
        }
        gray[y * width + x] = value;
      }
    }

    const mono = render.dither === "floyd"
      ? ditherGray(gray, width, height, threshold)
      : thresholdGray(gray, threshold);

    const targetCtx = canvas.getContext("2d", { willReadFrequently: true });
    const targetData = targetCtx.createImageData(width, height);
    for (let i = 0; i < mono.length; i += 1) {
      const value = mono[i] ? 0 : 255;
      const dataIndex = i * 4;
      targetData.data[dataIndex] = value;
      targetData.data[dataIndex + 1] = value;
      targetData.data[dataIndex + 2] = value;
      targetData.data[dataIndex + 3] = 255;
    }
    targetCtx.putImageData(targetData, 0, 0);
  }

  function thresholdGray(gray, threshold) {
    const mono = new Uint8Array(gray.length);
    for (let i = 0; i < gray.length; i += 1) {
      mono[i] = gray[i] < threshold ? 1 : 0;
    }
    return mono;
  }

  function ditherGray(gray, width, height, threshold) {
    const work = new Float32Array(gray);
    const mono = new Uint8Array(gray.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const oldValue = work[index];
        const black = oldValue < threshold;
        const newValue = black ? 0 : 255;
        const error = oldValue - newValue;
        mono[index] = black ? 1 : 0;
        distributeError(work, width, height, x + 1, y, error * 7 / 16);
        distributeError(work, width, height, x - 1, y + 1, error * 3 / 16);
        distributeError(work, width, height, x, y + 1, error * 5 / 16);
        distributeError(work, width, height, x + 1, y + 1, error * 1 / 16);
      }
    }
    return mono;
  }

  function distributeError(gray, width, height, x, y, error) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }
    gray[y * width + x] += error;
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

    return {
      bytes,
      meta: {
        schema: SCHEMA,
        width,
        height,
        format: "raw-1bpp-msb",
        bytes: bytes.length,
        crc32: crc32(bytes)
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
      const template = normalizeTemplate(page.template);
      const params = getPageParams(page);
      return {
        id: page.id,
        title: page.title || `Page ${index + 1}`,
        kind: TEMPLATE_DEFS[template].kind,
        template,
        params,
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
    const template = normalizeTemplate(page.template);
    const params = getPageParams(page);
    const heading = { type: "heading", text: page.title || "" };
    if (template === "schedule") {
      return [heading, { type: "agenda", items: parseAgendaLines(params.items) }];
    }
    if (template === "habit") {
      return [heading, { type: "checklist", items: parseHabitLines(params.habits) }, { type: "metric", label: "连续", value: params.streak, note: "" }];
    }
    if (template === "quote") {
      return [heading, { type: "quote", text: params.quote, by: params.by }];
    }
    if (template === "image") {
      return [
        heading,
        { type: "image", name: page.imageDataUrl ? "uploaded-image" : "placeholder", fit: "contain" },
        { type: "paragraph", text: params.caption }
      ];
    }
    if (template === "weather") {
      return [
        heading,
        { type: "metric", label: "城市", value: params.city, note: params.condition },
        { type: "metric", label: "温度", value: params.temp, note: params.highLow },
        { type: "metric", label: "湿度", value: params.humidity, note: params.wind },
        { type: "paragraph", text: params.advice }
      ];
    }
    if (template === "focus") {
      return [
        heading,
        { type: "metric", label: "任务", value: params.task, note: params.next },
        { type: "metric", label: "时间", value: `${params.minutes} min`, note: `${params.progress}%` }
      ];
    }
    if (template === "countdown") {
      return [
        heading,
        { type: "metric", label: params.event, value: `${params.left} days`, note: params.date },
        { type: "paragraph", text: params.note }
      ];
    }
    if (template === "notice") {
      return [heading, { type: "paragraph", text: params.message }, { type: "metric", label: params.tag, value: params.action, note: "" }];
    }
    if (template === "device") {
      return [
        heading,
        { type: "metric", label: "Wi-Fi", value: params.wifi, note: params.ip },
        { type: "metric", label: "电量", value: params.battery, note: params.status },
        { type: "paragraph", text: params.updated }
      ];
    }
    if (template === "word") {
      return [heading, { type: "metric", label: params.word, value: params.meaning, note: params.phonetic }, { type: "paragraph", text: params.example }];
    }
    return [
      heading,
      { type: "metric", label: "天气", value: params.weather, note: params.note },
      { type: "metric", label: "待办", value: params.todo, note: "" },
      { type: "metric", label: "下一项", value: params.next, note: "" },
      { type: "metric", label: "电量", value: params.battery, note: "" }
    ];
  }

  function serializeParams(template, params) {
    const normalized = normalizeTemplate(template);
    if (normalized === "schedule") {
      return params.items || "";
    }
    if (normalized === "habit") {
      return params.habits || "";
    }
    if (normalized === "quote") {
      return params.quote || "";
    }
    if (normalized === "image") {
      return params.caption || "";
    }
    if (normalized === "today") {
      return `天气 | ${params.weather}\n待办 | ${params.todo}\n下一项 | ${params.next}\n电量 | ${params.battery}\n提醒 | ${params.note}`;
    }
    return Object.entries(params)
      .map(([key, value]) => `${key} | ${value}`)
      .join("\n");
  }

  function paramsFromBody(template, body) {
    const normalized = normalizeTemplate(template);
    const text = String(body || "");
    if (normalized === "schedule") {
      return { items: text };
    }
    if (normalized === "habit") {
      return { habits: text };
    }
    if (normalized === "quote") {
      return { quote: text };
    }
    if (normalized === "image") {
      return { caption: text };
    }
    if (normalized === "today") {
      const result = {};
      parseMetricLines(text).forEach((item) => {
        if (item.label.includes("天气")) result.weather = item.value;
        if (item.label.includes("待办")) result.todo = item.value;
        if (item.label.includes("下一")) result.next = item.value;
        if (item.label.includes("电量")) result.battery = item.value;
        if (item.label.includes("提醒")) result.note = item.value;
      });
      return result;
    }
    const result = {};
    text.split(/\r?\n/).forEach((line) => {
      const parts = line.split("|").map((part) => part.trim());
      if (parts.length >= 2 && parts[0]) {
        result[parts[0]] = parts.slice(1).join(" | ");
      }
    });
    return result;
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

  function parseHabitLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((part) => part.trim());
        if (parts.length >= 2) {
          return { text: parts[0], checked: parts[1] === "1" || /^x|true|yes|done$/i.test(parts[1]) };
        }
        const match = line.match(/^(?:[-*]\s*)?\[(x|X| )\]\s*(.+)$/);
        if (match) {
          return { checked: match[1].toLowerCase() === "x", text: match[2] };
        }
        return { text: line, checked: false };
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
