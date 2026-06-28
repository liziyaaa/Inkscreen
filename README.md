# InkScreen Studio

手机端墨水屏摆件内容工具，当前方案面向 ESP32-C3 + 4.2 寸 400×300 黑白墨水屏。网页负责编辑参数、渲染 1bpp 位图、导出设备 Manifest，也可以通过 BLE 或局域网 Wi-Fi 把内容推给设备。

## 当前方案

- 默认尺寸：4.2 寸 400×300，`raw-1bpp-msb` 位图大小为 15000 B。
- 默认页面：今日总览、课程/日程、效率看板、氛围页、设备状态。
- 内容模型：每页都有 `template`、`params`、`blocks` 和渲染后的 `bitmap`。
- 自动更新：ESP32 定时唤醒后拉取 `inkscreen.manifest.v1`，只在 CRC 变化时下载对应 `.bin` 位图并刷新屏幕。
- 手动交互：旋钮/波轮用于翻页，按下可触发立即同步、刷新或进入设置。

## 传输方式

- BLE：适合首次配网、近距离手动更新、写入 Wi-Fi 配置。
- Wi-Fi 推送：网页向设备 `POST` 内容包或当前位图，适合局域网调试。
- Wi-Fi 拉取：推荐长期摆件方案。网页或后端生成 `manifest.json` 和页面 `.bin`，ESP32 周期性拉取。

## 内容包规范

详细规范见 [docs/content-package-v1.md](docs/content-package-v1.md)。核心格式：

- `inkscreen.package.v1`：完整内容包，包含所有页面参数和 base64 位图。
- `inkscreen.manifest.v1`：给 ESP32 拉取用的轻量清单，包含页面 URL、字节数和 CRC32。
- 位图格式：逐行打包，MSB first，黑点为 `1`，白点为 `0`。

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
