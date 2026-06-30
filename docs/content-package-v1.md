# InkScreen Content Package v1

InkScreen Studio exports firmware-friendly JSON and bitmap files for an ESP32-C3
driving a 4.2 inch 400×300 black-white e-paper display.

## Package Envelope

```json
{
  "schema": "inkscreen.package.v1",
  "packageId": "ink_20260628_123456_ab12",
  "createdAt": "2026-06-28T12:34:56.000Z",
  "tool": { "name": "InkScreen Studio", "version": "0.4.1" },
  "target": {
    "width": 400,
    "height": 300,
    "color": "bw",
    "bpp": 1,
    "pixelOrder": "row-major",
    "bitOrder": "msb",
    "blackBit": 1
  },
  "render": {
    "version": 2,
    "threshold": 128,
    "dither": "threshold",
    "invert": false,
    "fontScale": 1,
    "rasterScale": 4,
    "crisp": true
  },
  "updatePolicy": {
    "mode": "pull",
    "intervalMin": 30,
    "manifestUrl": "https://example.com/device/manifest.json",
    "timezone": "Asia/Shanghai"
  },
  "pages": []
}
```

## Page

Each page stores template parameters, structured blocks, and a display-ready
bitmap. Early firmware can draw `bitmap` directly; later firmware can choose to
re-render from `template` and `params`.

```json
{
  "id": "page_home",
  "title": "今日看板",
  "kind": "dashboard",
  "template": "today",
  "params": {
    "date": "06月28日",
    "weekday": "星期日",
    "weather": "晴 26C",
    "aqi": "AQI 42",
    "todo": "3",
    "next": "10:10 电路分析",
    "countdown": "PCB 下单 D-7",
    "battery": "86%",
    "note": "把最重要的一件事先做掉"
  },
  "order": 0,
  "durationSec": 0,
  "blocks": [],
  "bitmap": {
    "schema": "inkscreen.package.v1",
    "format": "raw-1bpp-msb",
    "width": 400,
    "height": 300,
    "bytes": 15000,
    "crc32": "1a2b3c4d",
    "encoding": "base64",
    "data": "..."
  }
}
```

`durationSec: 0` means manual wheel control. Non-zero values can be used by
firmware for automatic page rotation.

## Recommended Templates

- `today`: date, weather, AQI, next schedule item, todo count, countdown, device battery.
- `schedule`: course timetable or daily agenda.
- `productivity`: focus task, progress, todos, habit checks.
- `ambient`: quote, word card, short note or daily mood.
- `device`: Wi-Fi, IP, battery, update status.

## Blocks

Supported block types:

- `heading`: `{ "type": "heading", "text": "Today" }`
- `paragraph`: `{ "type": "paragraph", "text": "Body text" }`
- `agenda`: `{ "type": "agenda", "items": [{ "time": "08:00", "text": "Math", "meta": "A201" }] }`
- `checklist`: `{ "type": "checklist", "items": [{ "text": "Review", "checked": false }] }`
- `metric`: `{ "type": "metric", "label": "Battery", "value": "86%", "note": "12 days left" }`
- `quote`: `{ "type": "quote", "text": "Keep one useful thing visible.", "by": "InkScreen" }`
- `image`: `{ "type": "image", "name": "uploaded-image", "fit": "contain" }`

## Bitmap

- Format: `raw-1bpp-msb`
- Pixel order: row-major
- Bit order: MSB first
- Black pixel: bit `1`
- White pixel: bit `0`
- Row stride: `ceil(width / 8)` bytes
- 400×300 payload: `ceil(400 / 8) * 300 = 15000` bytes
- Tail bits after the final pixel of a row: `0`
- CRC32: calculated over raw bitmap bytes

Pixel packing:

```text
byteIndex = y * ceil(width / 8) + floor(x / 8)
bitIndex  = 7 - (x % 8)
```

## Pull Manifest

The recommended desk ornament mode is ESP32 pull update:

```json
{
  "schema": "inkscreen.manifest.v1",
  "generatedAt": "2026-06-28T12:34:56.000Z",
  "tool": { "name": "InkScreen Studio", "version": "0.4.1" },
  "target": { "width": 400, "height": 300, "bpp": 1 },
  "updatePolicy": {
    "mode": "pull",
    "intervalMin": 30,
    "manifestUrl": "https://example.com/device/manifest.json",
    "timezone": "Asia/Shanghai"
  },
  "pages": [
    {
      "id": "page_home",
      "title": "今日看板",
      "order": 0,
      "template": "today",
      "width": 400,
      "height": 300,
      "format": "raw-1bpp-msb",
      "bytes": 15000,
      "crc32": "1a2b3c4d",
      "url": "https://example.com/device/01-today-1a2b3c4d.bin"
    }
  ]
}
```

Firmware loop:

1. Wake by timer or wheel button.
2. Connect Wi-Fi and sync time with NTP.
3. `GET manifestUrl`, parse `inkscreen.manifest.v1`.
4. Compare each page `crc32` with the CRC stored in NVS/LittleFS.
5. Download only changed `.bin` files.
6. Draw the selected page to the e-paper, then store CRC and sleep.

Suggested intervals:

- Weather and schedule: 30 minutes.
- Daily quote, word, countdown: once per day plus manual refresh.
- Device status: update locally before sleep without network if possible.

## BLE

```text
Service: 9f2a0001-6f37-4f1e-9a5e-1b5c00000001
Control: 9f2a0002-6f37-4f1e-9a5e-1b5c00000001
Data:    9f2a0003-6f37-4f1e-9a5e-1b5c00000001
Status:  9f2a0004-6f37-4f1e-9a5e-1b5c00000001
```

Full package:

1. Control JSON: `{"cmd":"package_begin","schema":"inkscreen.package.v1","bytes":12345}`
2. UTF-8 package JSON chunks on the Data characteristic.
3. Control JSON: `{"cmd":"package_end","crc32":"..."}`

Current bitmap only:

1. Control JSON: `{"cmd":"bitmap_begin","width":400,"height":300,"format":"raw-1bpp-msb","bytes":15000}`
2. Raw bitmap byte chunks on the Data characteristic.
3. Control JSON: `{"cmd":"bitmap_end","crc32":"..."}`

Recommended default chunk size: 180 bytes.

## Wi-Fi Push

Full package:

```http
POST /api/v1/inkscreen/package
Content-Type: application/json
X-InkScreen-Schema: inkscreen.package.v1
```

Current bitmap:

```http
POST /api/display/bitmap
Content-Type: application/octet-stream
X-InkScreen-Meta: <base64url-json>
```

Firmware should support CORS if uploads are sent from a hosted browser page.
