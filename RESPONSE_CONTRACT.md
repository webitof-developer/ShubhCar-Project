# API Response Contract

## Canonical envelope

All API endpoints must respond with the same top-level envelope:

```json
{
  "success": true,
  "data": {},
  "message": "OK",
  "meta": {},
  "requestId": "..."
}
```

`message`, `meta`, and `requestId` may vary by endpoint/middleware, but `success` and `data` are mandatory.

## List endpoints

### Non-paginated list

Use this shape when returning a bounded list (for example `top-N` analytics):

```json
{
  "success": true,
  "data": []
}
```

### Paginated list

Use this shape for pageable resources:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 1
    }
  }
}
```

Frontend must always read list data from `data.items` for paginated endpoints and from `data` for non-paginated endpoints.

## Analytics endpoints covered in this hardening pass

These endpoints are standardized as non-paginated lists:

- `GET /analytics/top-products`
- `GET /analytics/sales-by-state`
- `GET /analytics/sales-by-city`
- `GET /analytics/top-categories`
- `GET /analytics/top-brands`

Each now guarantees:

```json
{
  "success": true,
  "data": []
}
```

## Frontend integration rule

- Never assume raw array responses.
- Always unwrap the envelope first.
- Primary read path: `response.data.data` (legacy nested format).
- Fallback read path: `response.data` (canonical format).
- Before `map/filter/find`, enforce array guards (`Array.isArray(...)`).

## Dashboard implementation notes

- `analyticsApi.fetchWithAuth` now normalizes to the unwrapped payload and supports both canonical and legacy nested list/object responses.
- Dashboard list renderers must consume arrays only after normalization (`Array.isArray(...) ? value : []`).
