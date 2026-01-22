# Promissum API Reference Guide

Promissum provides a RESTful API with integrated time-lock encryption service.
This guide provides a comprehensive reference for integrating with Promissum.

**Base URL:** `http://localhost:3000/api` (Adjust scheme and host as needed)

---

## 🔐 Authentication

Promissum uses device fingerprinting for single-user deployments. Rate limiting is enforced via Redis.

**For self-hosted deployments:**
- No authentication required for endpoints
- Rate limiting applies to all requests
- Device fingerprint identifies the client

---

## 📦 Items API

Core functionality for creating, retrieving, and managing encrypted items.

### 1. List Items

Retrieve a list of all items with optional filtering.

**Endpoint:** `GET /api/items`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `string` | `all` | Filter by lock status: `all`, `locked`, `unlocked` |
| `type` | `string` | - | Filter by content type: `text` or `image` |
| `sort` | `string` | `created_desc` | Sort order: `created_asc`, `created_desc`, `decrypt_asc`, `decrypt_desc` |
| `search` | `string` | - | Fuzzy search query for item names/content |

**Example:**
```bash
curl "http://localhost:3000/api/items?status=locked"
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "type": "text",
    "encryptedData": "base64-encoded-ciphertext",
    "originalName": "My Secret",
    "decryptAt": 1735230000000,
    "roundNumber": 12345,
    "createdAt": 1735226400000,
    "layerCount": 1,
    "unlocked": false,
    "timeRemainingMs": 3600000
  }
]
```

---

### 2. Create Encrypted Item

Create a single encrypted item (Time Capsule).

**Endpoint:** `POST /api/items`

**Request Body:**

```json
{
  "type": "text",             // Required: "text" or "image"
  "content": "Secret...",     // Required: Text string or Base64 image data
  "durationMinutes": 60,      // Optional: Duration until unlock
  "decryptAt": 1735230000000, // Optional: Specific epoch timestamp (ms) to unlock
  "originalName": "My Item"   // Optional: Custom name for the item
}
```
*Note: Must provide either `durationMinutes` or `decryptAt`.*

**Example (Text):**
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": "Secret Message 123",
    "durationMinutes": 60,
    "originalName": "My Secret"
  }'
```

**Example (Image):**
```bash
# Images must be Base64 encoded strings
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "content": "iVBORw0KGgoAAA...",
    "durationMinutes": 1440,
    "originalName": "Photo.png"
  }'
```

**Response:**
```json
{
  "id": "uuid-string",
  "type": "text",
  "encryptedData": "base64-encoded-ciphertext",
  "originalName": "My Secret",
  "decryptAt": 1735230000000,
  "roundNumber": 12345,
  "createdAt": 1735226400000,
  "layerCount": 1,
  "unlocked": false
}
```

---

### 3. Get Item Details (Retrieve/Decrypt)

Fetch item details. The server automatically attempts to decrypt the content if the unlock time has passed.

**Endpoint:** `GET /api/items/:id`

**Response (Locked):**
```json
{
  "id": "uuid-string",
  "type": "text",
  "unlocked": false,
  "timeRemainingMs": 3600000,
  "decryptAt": 1735230000000,
  "content": null
}
```

**Response (Unlocked):**
```json
{
  "id": "uuid-string",
  "type": "text",
  "unlocked": true,
  "content": "Secret Message 123"
}
```

---

### 4. Extend Lock

Extend the duration of an existing encrypted item. This re-encrypts the data with a new time lock.

**Endpoint:** `POST /api/items/:id/extend`

**Request Body:**
```json
{
  "minutes": 30  // Required: Number of minutes to add
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/items/ITEM_ID/extend \
  -H "Content-Type: application/json" \
  -d '{ "minutes": 30 }'
```

**Response:**
```json
{
  "id": "uuid-string",
  "decryptAt": 1735231800000,
  "roundNumber": 12350,
  "layerCount": 2
}
```

---

### 5. Delete Item

Permanently remove an item from the database.

**Endpoint:** `DELETE /api/items/:id`

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/items/ITEM_ID
```

**Response:** `204 No Content`

---

## 📊 Statistics API

### Get Statistics

Get global statistics about stored items.

**Endpoint:** `GET /api/stats`

**Example Response:**
```json
{
  "totalItems": 100,
  "lockedItems": 80,
  "unlockedItems": 20,
  "byType": { "text": 90, "image": 10 },
  "avgLockDurationMinutes": 120
}
```

---

## ⚙️ Preferences API

User preferences management for device-specific settings.

### Get Preferences

Get preferences for the current device (identified by fingerprint).

**Endpoint:** `GET /api/preferences`

**Response:**
```json
{
  "defaultDurationMinutes": 60,
  "privacyMode": false,
  "panicUrl": "https://google.com",
  "themeConfig": {},
  "dateTimeFormat": "yyyy-MM-dd HH:mm",
  "compactMode": false,
  "confirmDelete": true,
  "confirmExtend": true,
  "cacheTTLMinutes": 5
}
```

---

### Update Preferences

Update preferences for the current device.

**Endpoint:** `POST /api/preferences`

**Request Body:**
```json
{
  "defaultDurationMinutes": 120,
  "privacyMode": true,
  "themeConfig": { "primaryColor": "#3b82f6" }
}
```

---

## ❤️ Health Check

Check if the API server is running. No authentication required.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-28T10:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

---

## 🔄 Real-Time Updates

Promissum supports Server-Sent Events (SSE) for real-time updates.

### SSE Endpoint

**Endpoint:** `GET /api/sse`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceId` | `string` | Device fingerprint for identification |

**Example:**
```bash
curl -N "http://localhost:3000/api/sse?deviceId=abc123"
```

**Event Types:**
- `preferences.updated` - Settings have changed
- `items.created` - New item created
- `items.updated` - Item status changed
- `items.deleted` - Item deleted

---

## ⚠️ Integration Notes

1.  **Time Precision**: Time locks rely on drand rounds (approx. every 3 seconds). Do not expect millisecond-level precision for unlock times.
2.  **Immutability**: Once created, the unlock time can only be **extended**, never reduced.
3.  **Content Size**: Large Base64 images will increase payload size significantly. Consider request body size limits (default Next.js limit is 4MB).
4.  **Rate Limiting**: All endpoints are rate-limited via Redis. Default: 100 requests per minute per device.
5.  **Device Fingerprinting**: Use a consistent device identifier for requests to enable proper multi-device sync.

---

## 🔒 Encryption Details

Promissum uses **Identity-Based Encryption (IBE)** with the **drand** decentralized randomness network:

- **Curve**: BLS12-381
- **Network**: drand mainnet (or mock for development)
- **Round Duration**: ~3 seconds
- **Layer Support**: Multiple encryption layers for extending locks

**Encryption Flow:**
1. Client sends content + unlock time
2. Server generates future drand round number
3. Content is encrypted using the round's future beacon
4. Ciphertext is stored in database
5. At unlock time, server fetches drand beacon to decrypt

---

## 📋 Error Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Resource created |
| `204` | Success (no content) |
| `400` | Bad request (invalid parameters) |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

**Error Response Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```
