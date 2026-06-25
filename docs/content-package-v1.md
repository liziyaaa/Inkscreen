# InkScreen Content Package v1

InkScreen Studio exports one self-contained JSON package for BLE, Wi-Fi, and
offline file transfer.

## Envelope

```json
{
  "schema": "inkscreen.package.v1",
  "packageId": "ink_20260625_123456_ab12",
  "createdAt": "2026-06-25T12:34:56.000Z",
  "tool": { "name": "InkScreen Studio", "version": "0.2.0" },
  "target": {
    "width": 250,
    "height": 122,
    "color": "bw",
    "bpp": 1,
    "pixelOrder": "row-major",
    "bitOrder": "msb",
    "blackBit": 1
  },
  "render": {
    "threshold": 156,
    "dither": "threshold",
    "invert": false,
    "fontScale": 1
  },
  "pages": []
}
```

## Page

Each page stores both structured blocks and a firmware-ready bitmap.

```json
{
  "id": "page_home",
  "title": "Today",
  "kind": "dashboard",
  "order": 0,
  "durationSec": 0,
  "blocks": [],
  "bitmap": {
    "schema": "inkscreen.package.v1",
    "format": "raw-1bpp-msb",
    "width": 250,
    "height": 122,
    "bytes": 3813,
    "crc32": "1a2b3c4d",
    "encoding": "base64",
    "data": "..."
  }
}
```

`durationSec: 0` means manual wheel control. A later firmware can use non-zero
values for automatic page rotation.

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
- Tail bits after the final pixel of a row: `0`
- CRC32: calculated over raw bitmap bytes

Pixel packing:

```text
byteIndex = y * ceil(width / 8) + floor(x / 8)
bitIndex  = 7 - (x % 8)
```

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

1. Control JSON: `{"cmd":"bitmap_begin","width":250,"height":122,"format":"raw-1bpp-msb","bytes":3813}`
2. Raw bitmap byte chunks on the Data characteristic.
3. Control JSON: `{"cmd":"bitmap_end","crc32":"..."}`

Recommended default chunk size: 180 bytes.

## Wi-Fi

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
