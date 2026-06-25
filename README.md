# InkScreen Studio

手机端墨水屏内容工具，用来给 ESP32-C3 墨水屏摆件编辑、预览、导出和上传内容。

## 功能

- 多页内容 deck：看板、日程、清单、便签、图片。
- 模板参数化编辑：天气、番茄钟、倒计时、习惯打卡、桌面提醒、设备状态、单词卡等。
- 浏览器端高清离屏渲染黑白预览，并打包成 `raw-1bpp-msb` 位图。
- 导出 `inkscreen.package.v1` JSON 内容包。
- 支持 Web Bluetooth 发送完整内容包或当前位图。
- 支持 Wi-Fi HTTP 上传接口草案。
- 可作为 PWA 安装，静态部署到 GitHub Pages。

## 内容包规范

规范文档见 `docs/content-package-v1.md`。每个页面同时包含：

- `template` / `params`：模板与参数，便于手机端、网页端和固件同步同一套内容模型。
- `blocks`：结构化内容，便于后续固件或服务端重排。
- `bitmap`：已经渲染好的 1bpp 数据，便于 ESP32 早期固件直接显示。

## BLE UUID

```text
Service: 9f2a0001-6f37-4f1e-9a5e-1b5c00000001
Control: 9f2a0002-6f37-4f1e-9a5e-1b5c00000001
Data:    9f2a0003-6f37-4f1e-9a5e-1b5c00000001
Status:  9f2a0004-6f37-4f1e-9a5e-1b5c00000001
```

## 本地运行

```bash
python -m http.server 5173
```

然后打开 `http://127.0.0.1:5173/`。

Web Bluetooth 需要 Chrome/Edge 系浏览器，并且线上部署时需要 HTTPS。GitHub Pages 满足 HTTPS 条件。Wi-Fi 直连局域网 HTTP 设备时，浏览器可能因为 HTTPS 到 HTTP 混合内容或 Private Network Access 策略拦截请求；BLE 上传不受这个限制。
