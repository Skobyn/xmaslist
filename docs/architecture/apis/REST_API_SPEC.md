# REST API Specification - Christmas Wishlist Application

## Base URL
```
Production: https://api.wishlist.app/v1
Development: http://localhost:3000/api/v1
```

## Authentication

### Headers
All authenticated endpoints require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Format
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "display_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "email_verified": false,
    "created_at": "2024-12-01T10:00:00Z"
  },
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid email or weak password
- `409 Conflict` - Email already exists

---

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe"
  },
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account inactive

---

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "...",
  "expires_in": 3600
}
```

---

### Logout
```http
POST /auth/logout
```

**Request Body:**
```json
{
  "refresh_token": "..."
}
```

**Response (204 No Content)**

---

### Request Password Reset
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

---

### Reset Password
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successful"
}
```

---

## User Endpoints

### Get Current User
```http
GET /users/me
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://storage.app/avatars/uuid.jpg",
  "email_verified": true,
  "created_at": "2024-12-01T10:00:00Z"
}
```

---

### Update Current User
```http
PATCH /users/me
```

**Request Body:**
```json
{
  "display_name": "John Smith",
  "first_name": "John",
  "last_name": "Smith"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "John Smith",
  "first_name": "John",
  "last_name": "Smith",
  "updated_at": "2024-12-01T11:00:00Z"
}
```

---

### Upload Avatar
```http
POST /users/me/avatar
Content-Type: multipart/form-data
```

**Request Body:**
```
file: (binary image data)
```

**Response (200 OK):**
```json
{
  "avatar_url": "https://storage.app/avatars/uuid.jpg"
}
```

**Errors:**
- `400 Bad Request` - Invalid image format (only JPG, PNG allowed)
- `413 Payload Too Large` - Image exceeds 5MB

---

### Get User by ID
```http
GET /users/:id
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "display_name": "Jane Doe",
  "avatar_url": "https://storage.app/avatars/uuid.jpg"
}
```

Note: Only returns public information for other users

---

## Location Endpoints

### List Locations
```http
GET /locations?page=1&limit=20&archived=false
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page
- `archived` (optional, default: false) - Include archived locations

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Mom's House",
      "description": "Christmas at Mom's",
      "owner_id": "uuid",
      "owner": {
        "id": "uuid",
        "display_name": "John Doe"
      },
      "member_count": 5,
      "list_count": 3,
      "is_archived": false,
      "created_at": "2024-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

---

### Create Location
```http
POST /locations
```

**Request Body:**
```json
{
  "name": "Dad's House",
  "description": "Annual Christmas gathering"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Dad's House",
  "description": "Annual Christmas gathering",
  "owner_id": "uuid",
  "is_archived": false,
  "created_at": "2024-12-01T10:00:00Z"
}
```

---

### Get Location
```http
GET /locations/:id?include=members,lists
```

**Query Parameters:**
- `include` (optional) - Comma-separated: members, lists, statistics

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Mom's House",
  "description": "Christmas at Mom's",
  "owner_id": "uuid",
  "owner": {
    "id": "uuid",
    "display_name": "John Doe"
  },
  "members": [
    {
      "user_id": "uuid",
      "user": {
        "id": "uuid",
        "display_name": "Jane Doe",
        "avatar_url": "https://storage.app/avatars/uuid.jpg"
      },
      "role": "editor",
      "added_at": "2024-11-15T10:00:00Z"
    }
  ],
  "lists": [
    {
      "id": "uuid",
      "title": "John's Wishlist 2024",
      "year": 2024,
      "item_count": 12
    }
  ],
  "is_archived": false,
  "created_at": "2024-11-01T10:00:00Z"
}
```

**Errors:**
- `404 Not Found` - Location doesn't exist
- `403 Forbidden` - No access to location

---

### Update Location
```http
PATCH /locations/:id
```

**Request Body:**
```json
{
  "name": "Mom's Updated House",
  "description": "New description",
  "is_archived": false
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Mom's Updated House",
  "description": "New description",
  "updated_at": "2024-12-01T11:00:00Z"
}
```

**Errors:**
- `403 Forbidden` - Only owner or admin can update

---

### Delete Location
```http
DELETE /locations/:id
```

**Response (204 No Content)**

**Errors:**
- `403 Forbidden` - Only owner can delete
- `409 Conflict` - Location has active lists

---

### Add Member to Location
```http
POST /locations/:id/members
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "role": "editor"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "location_id": "uuid",
  "user_id": "uuid",
  "role": "editor",
  "added_at": "2024-12-01T10:00:00Z"
}
```

---

### Remove Member from Location
```http
DELETE /locations/:id/members/:user_id
```

**Response (204 No Content)**

---

### Update Member Role
```http
PATCH /locations/:id/members/:user_id
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "role": "admin",
  "updated_at": "2024-12-01T11:00:00Z"
}
```

---

## List Endpoints

### List User's Lists
```http
GET /lists?location_id=uuid&year=2024&page=1&limit=20
```

**Query Parameters:**
- `location_id` (optional) - Filter by location
- `year` (optional) - Filter by year
- `active_only` (optional, default: true) - Only active lists
- `page`, `limit` - Pagination

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "John's Wishlist 2024",
      "description": "My Christmas wishes",
      "location_id": "uuid",
      "location": {
        "id": "uuid",
        "name": "Mom's House"
      },
      "owner_id": "uuid",
      "year": 2024,
      "is_active": true,
      "is_public": false,
      "item_count": 12,
      "purchased_count": 5,
      "total_value": 1250.00,
      "created_at": "2024-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

---

### Create List
```http
POST /lists
```

**Request Body:**
```json
{
  "title": "My Christmas Wishlist 2024",
  "description": "Things I'd love to receive",
  "location_id": "uuid",
  "year": 2024,
  "is_public": false,
  "theme_color": "#e63946"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "title": "My Christmas Wishlist 2024",
  "description": "Things I'd love to receive",
  "location_id": "uuid",
  "owner_id": "uuid",
  "year": 2024,
  "is_active": true,
  "is_public": false,
  "guest_access_token": "abc123...",
  "theme_color": "#e63946",
  "created_at": "2024-12-01T10:00:00Z"
}
```

---

### Get List
```http
GET /lists/:id?include=items,location,statistics
```

**Query Parameters:**
- `include` (optional) - Comma-separated: items, location, statistics, shares

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "John's Wishlist 2024",
  "description": "My Christmas wishes",
  "location": {
    "id": "uuid",
    "name": "Mom's House"
  },
  "owner": {
    "id": "uuid",
    "display_name": "John Doe",
    "avatar_url": "https://storage.app/avatars/uuid.jpg"
  },
  "year": 2024,
  "is_active": true,
  "is_public": false,
  "theme_color": "#e63946",
  "items": [
    {
      "id": "uuid",
      "title": "Wireless Headphones",
      "price": 299.99,
      "currency": "USD",
      "is_purchased": false,
      "priority": "high"
    }
  ],
  "statistics": {
    "total_items": 12,
    "purchased_items": 5,
    "total_value": 1250.00,
    "purchased_value": 450.00
  },
  "created_at": "2024-11-01T10:00:00Z"
}
```

---

### Update List
```http
PATCH /lists/:id
```

**Request Body:**
```json
{
  "title": "Updated Wishlist Title",
  "description": "Updated description",
  "is_active": true,
  "is_public": false,
  "theme_color": "#457b9d"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Updated Wishlist Title",
  "updated_at": "2024-12-01T11:00:00Z"
}
```

---

### Delete List
```http
DELETE /lists/:id
```

**Response (204 No Content)**

---

### Get List by Guest Token
```http
GET /lists/guest/:token
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "John's Wishlist 2024",
  "owner": {
    "display_name": "John Doe"
  },
  "items": [...],
  "is_public": false
}
```

Note: Guest access may have limited permissions (view-only)

---

## Item Endpoints

### List Items
```http
GET /items?list_id=uuid&purchased=false&priority=high&page=1
```

**Query Parameters:**
- `list_id` (required) - List to fetch items from
- `purchased` (optional) - Filter by purchase status
- `priority` (optional) - Filter by priority (low, medium, high)
- `sort` (optional, default: created_at) - Sort field
- `order` (optional, default: desc) - Sort order (asc, desc)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "list_id": "uuid",
      "title": "Wireless Headphones",
      "description": "Noise-cancelling over-ear headphones",
      "price": 299.99,
      "currency": "USD",
      "url": "https://amazon.com/product",
      "image_url": "https://storage.app/items/uuid.jpg",
      "is_purchased": false,
      "priority": "high",
      "quantity": 1,
      "created_by": {
        "id": "uuid",
        "display_name": "John Doe"
      },
      "created_at": "2024-11-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12
  }
}
```

---

### Create Item
```http
POST /items
```

**Request Body:**
```json
{
  "list_id": "uuid",
  "title": "Wireless Headphones",
  "description": "Noise-cancelling over-ear headphones",
  "price": 299.99,
  "currency": "USD",
  "url": "https://amazon.com/product",
  "priority": "high",
  "quantity": 1
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "list_id": "uuid",
  "title": "Wireless Headphones",
  "description": "Noise-cancelling over-ear headphones",
  "price": 299.99,
  "currency": "USD",
  "url": "https://amazon.com/product",
  "is_purchased": false,
  "priority": "high",
  "quantity": 1,
  "created_by": "uuid",
  "created_at": "2024-12-01T10:00:00Z"
}
```

**Errors:**
- `403 Forbidden` - No permission to add items to list
- `400 Bad Request` - Invalid price or URL format

---

### Get Item
```http
GET /items/:id
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "list_id": "uuid",
  "title": "Wireless Headphones",
  "description": "Noise-cancelling over-ear headphones",
  "price": 299.99,
  "currency": "USD",
  "url": "https://amazon.com/product",
  "image_url": "https://storage.app/items/uuid.jpg",
  "is_purchased": false,
  "purchased_by": null,
  "purchased_at": null,
  "priority": "high",
  "quantity": 1,
  "created_by": {
    "id": "uuid",
    "display_name": "John Doe"
  },
  "created_at": "2024-11-15T10:00:00Z"
}
```

---

### Update Item
```http
PATCH /items/:id
```

**Request Body:**
```json
{
  "title": "Updated Wireless Headphones",
  "price": 249.99,
  "priority": "medium"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Updated Wireless Headphones",
  "price": 249.99,
  "priority": "medium",
  "updated_at": "2024-12-01T11:00:00Z"
}
```

---

### Delete Item
```http
DELETE /items/:id
```

**Response (204 No Content)**

**Errors:**
- `403 Forbidden` - Can only delete own items or if owner/admin

---

### Mark Item as Purchased
```http
POST /items/:id/purchase
```

**Request Body:**
```json
{
  "notes": "Bought from local store, saved $50"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "is_purchased": true,
  "purchased_by": "uuid",
  "purchased_at": "2024-12-01T11:00:00Z",
  "notes": "Bought from local store, saved $50"
}
```

---

### Unmark Item as Purchased
```http
DELETE /items/:id/purchase
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "is_purchased": false,
  "purchased_by": null,
  "purchased_at": null
}
```

---

### Upload Item Image
```http
POST /items/:id/image
Content-Type: multipart/form-data
```

**Request Body:**
```
file: (binary image data)
```

**Response (200 OK):**
```json
{
  "image_url": "https://storage.app/items/uuid.jpg"
}
```

---

## Share Endpoints

### Create Share
```http
POST /shares
```

**Request Body:**
```json
{
  "resource_type": "list",
  "resource_id": "uuid",
  "shared_with": "user_email@example.com",
  "role": "editor",
  "expires_at": "2025-01-01T00:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "resource_type": "list",
  "resource_id": "uuid",
  "shared_by": "uuid",
  "shared_with": "uuid",
  "role": "editor",
  "expires_at": "2025-01-01T00:00:00Z",
  "created_at": "2024-12-01T10:00:00Z"
}
```

Note: System will look up user by email and create invitation if user doesn't exist

---

### List Shares for Resource
```http
GET /shares/resource/:resource_type/:resource_id
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "shared_with": {
        "id": "uuid",
        "display_name": "Jane Doe",
        "email": "jane@example.com"
      },
      "role": "editor",
      "created_at": "2024-11-15T10:00:00Z",
      "expires_at": null
    }
  ]
}
```

---

### Update Share
```http
PATCH /shares/:id
```

**Request Body:**
```json
{
  "role": "admin",
  "expires_at": "2025-06-01T00:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "role": "admin",
  "expires_at": "2025-06-01T00:00:00Z",
  "updated_at": "2024-12-01T11:00:00Z"
}
```

---

### Delete Share (Revoke Access)
```http
DELETE /shares/:id
```

**Response (204 No Content)**

---

## Search Endpoints

### Search Items
```http
GET /search/items?q=headphones&list_id=uuid
```

**Query Parameters:**
- `q` (required) - Search query
- `list_id` (optional) - Limit to specific list
- `location_id` (optional) - Limit to specific location

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Wireless Headphones",
      "price": 299.99,
      "list": {
        "id": "uuid",
        "title": "John's Wishlist"
      },
      "relevance_score": 0.95
    }
  ],
  "query": "headphones",
  "total": 3
}
```

---

### Search Users
```http
GET /search/users?q=john
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "display_name": "John Doe",
      "email": "john@example.com",
      "avatar_url": "https://storage.app/avatars/uuid.jpg"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

- **Authenticated users**: 100 requests per minute
- **Guest access**: 20 requests per minute
- **Search endpoints**: 30 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701432000
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```
GET /lists?page=2&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": true
  },
  "links": {
    "self": "/lists?page=2&limit=20",
    "first": "/lists?page=1&limit=20",
    "prev": "/lists?page=1&limit=20",
    "next": "/lists?page=3&limit=20",
    "last": "/lists?page=3&limit=20"
  }
}
```

---

## Filtering and Sorting

### Filtering
```
GET /items?list_id=uuid&is_purchased=false&priority=high
```

### Sorting
```
GET /items?sort=price&order=desc
GET /items?sort=-price  (shorthand for desc)
```

### Multiple Sorts
```
GET /items?sort=priority,created_at&order=desc,asc
```

---

## WebSocket API (Real-time Updates)

### Connection
```javascript
const ws = new WebSocket('wss://api.wishlist.app/ws?token=<access_token>')
```

### Subscribe to List Updates
```json
{
  "action": "subscribe",
  "resource": "list",
  "resource_id": "uuid"
}
```

### Receive Updates
```json
{
  "event": "item_created",
  "resource": "item",
  "data": {
    "id": "uuid",
    "title": "New Item",
    "list_id": "uuid"
  },
  "timestamp": "2024-12-01T11:00:00Z"
}
```

### Events
- `item_created`
- `item_updated`
- `item_deleted`
- `item_purchased`
- `list_updated`
- `share_created`
- `share_deleted`

---

## Bulk Operations

### Bulk Create Items
```http
POST /items/bulk
```

**Request Body:**
```json
{
  "list_id": "uuid",
  "items": [
    {
      "title": "Item 1",
      "price": 29.99,
      "priority": "high"
    },
    {
      "title": "Item 2",
      "price": 49.99,
      "priority": "medium"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "created": 2,
  "items": [...]
}
```

---

### Bulk Update Items
```http
PATCH /items/bulk
```

**Request Body:**
```json
{
  "updates": [
    {
      "id": "uuid1",
      "priority": "low"
    },
    {
      "id": "uuid2",
      "is_purchased": true
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "updated": 2,
  "items": [...]
}
```

---

## API Versioning

The API uses URL-based versioning:
- `/api/v1/...` - Current version
- `/api/v2/...` - Future versions

Deprecated versions will be supported for 12 months after new version release.

---

## CORS Policy

Allowed origins:
- `https://wishlist.app`
- `https://app.wishlist.app`
- `http://localhost:3000` (development)

Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

Allowed headers: `Authorization`, `Content-Type`, `X-Request-ID`

---

## Security

### HTTPS Only
All API requests must use HTTPS in production.

### Request Signing (Optional)
For sensitive operations, requests can be signed:
```
X-Signature: sha256=abc123...
X-Timestamp: 1701432000
```

### IP Whitelisting
Available for enterprise customers.

---

## Client SDKs

Official SDKs available:
- JavaScript/TypeScript (npm: `@wishlist/sdk`)
- Python (pip: `wishlist-sdk`)
- iOS (Swift Package Manager)
- Android (Maven)

Example usage:
```typescript
import { WishlistClient } from '@wishlist/sdk'

const client = new WishlistClient({
  apiKey: 'your_api_key'
})

const lists = await client.lists.getAll()
```
