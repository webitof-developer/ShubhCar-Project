# Backend Connectivity Map

## A) Runtime Entry Chain

1. `server.js`
2. `app.js`
3. `api/index.js`
4. `api/routes.js`

`server.js` initializes environment, connects Mongo/Redis, starts cron/schedulers, imports `workers/payment-webhook.worker.js` (startup side effect), then starts HTTP server.

`app.js` configures global app middleware and mounts API gateway on `/api`.

`api/index.js` applies API middleware pipeline (with webhook raw-body bypass), registers routes, and applies centralized error handling.

`api/routes.js` is the route registry for `/v1/*` endpoints and webhook raw handlers.

## B) Middleware Chain (In Order)

### In `app.js`

1. `app.disable('x-powered-by')`
2. debug header middleware
3. `requestIdMiddleware`
4. `compression()`
5. `helmet(...)`
6. `cors(...)`
7. static `/uploads`
8. optional swagger `/docs` and `/docs.json`
9. `apiGateway.use(apiLimiter)` (before mount)
10. `app.use('/api', apiGateway)`

### In `api/index.js`

1. webhook detector (`/api/v1/payments/webhook*`)
2. `express.json({ limit: '1mb' })` (skipped for webhooks)
3. `express.urlencoded(...)` (skipped for webhooks)
4. `sanitize.middleware` (skipped for webhooks)
5. `response.middleware`
6. route registration (`api/routes.js`)
7. sentry error handler
8. centralized `error.middleware`

## C) Router Mount Map

Base: `/api` then versioned mounts under `/v1/*`.

1. `/v1/payments/webhook/stripe` -> raw body -> `modules/payments/webhook.routes.stripe`
2. `/v1/payments/webhook/razorpay` -> raw body -> `modules/payments/webhook.routes.razorpay`
3. `/v1/auth` -> `modules/auth/auth.routes`
4. `/v1/users` -> `modules/users/users.routes`
5. `/v1/user-addresses` -> `modules/userAddresses/userAddresses.routes`
6. `/v1/admin` -> `modules/admin/admin.routes`
7. `/v1/analytics` -> `modules/analytics/analytics.routes`
8. `/v1/settings` -> `modules/settings/settings.routes`
9. `/v1/roles` -> `modules/roles/roles.routes`
10. `/v1/media` -> `modules/media/media.routes`
11. `/v1/pages` -> `modules/pages/page.routes`
12. `/v1/email-templates` -> `modules/emailTemplates/emailTemplates.routes`
13. `/v1/user-activity-logs` -> `modules/userActivityLogs/userActivityLogs.routes`
14. `/v1/categories` -> `modules/categories/categories.routes`
15. `/v1/category-attributes` -> `modules/categoryAttribute/categoryAttribute.routes`
16. `/v1/products`, `/v1/product` -> `modules/products/products.routes`
17. `/v1/brands` -> `modules/brands/brands.routes`
18. `/v1/models` -> `modules/models/models.routes`
19. Vehicle management via `modules/vehicle-management/index.js`:
`/v1/vehicle-brands`, `/v1/vehicle-models`, `/v1/vehicle-years`, `/v1/vehicle-model-years`, `/v1/vehicle-attributes`, `/v1/vehicle-attribute-values`, `/v1/vehicle-variants`, `/v1/vehicles`
20. `/v1/tags` -> `modules/tags/tags.routes`
21. `/v1/product-attributes` -> `modules/productAttribute/productAttribute.routes`
22. `/v1/product-attribute-values` -> `modules/productAttributeValues/productAttributeValues.routes`
23. `/v1/product-images` -> `modules/productImages/productImages.routes`
24. `/v1/product-variants` -> `modules/productVariants/productVariant.routes`
25. `/v1/inventory` -> `modules/inventory/inventory.routes`
26. `/v1/inventory-logs` -> `modules/inventoryLogs/inventoryLogs.routes`
27. `/v1/reviews` -> `modules/reviews/reviews.routes`
28. `/v1/wishlist` -> `modules/wishlist/wishlist.routes`
29. `/v1/product-compatibility` -> `modules/productCompatibility/productCompatibility.routes`
30. `/v1/cart` -> `modules/cart/cart.routes`
31. `/v1/orders` -> `modules/orders/orders.routes`
32. `/v1/order-items` -> `modules/orderItems/orderItems.routes`
33. `/v1/shipments` -> `modules/shipments/shipment.routes`
34. `/v1/returns` -> `modules/returns/return.routes`
35. `/v1/invoices` -> `modules/invoice/invoice.routes`
36. `/v1/shipping-rules` -> `modules/shippingRules/shippingRules.routes`
37. `/v1/tax` -> `modules/tax/tax.routes`
38. `/v1/payments` -> `modules/payments/payments.routes`
39. `/v1/coupons` -> `modules/coupons/coupons.routes`
40. `/v1/sales-reports` -> `modules/salesReports/salesReports.routes`
41. `/v1/notifications` -> `modules/notifications/notifications.routes`
42. `/v1/entries` -> `modules/entries/entries.routes`
43. fallback 404 -> `res.fail(...)`

## D) Worker / Queue Map

### Started directly from API bootstrap

1. `server.js` imports `workers/payment-webhook.worker.js` (side-effect startup)

### Runtime-reachable queue definitions

1. `queues/paymentWebhook.queue.js`
2. `queues/paymentRetry.queue.js`
3. `queues/order.queue.js`
4. `queues/payout.queue.js`
5. `queues/email.queue.js`
6. `queues/manualReview.queue.js`
7. `queues/productBulkCreate.queue.js`
8. `queues/productBulkUpdate.queue.js`
9. `queues/user.queue.js`

### Cron / scheduler startup from `server.js`

1. `modules/coupons/coupon.cron.js`
2. `crons/payment-reconciliation.cron.js`
3. `services/keepAlive.service.js`

### Additional workers present but not imported by `server.js` entry chain

1. `workers/email.worker.js`
2. `workers/order.worker.js`
3. `workers/payment-retry.worker.js`
4. `workers/manualReview.worker.js`
5. `workers/inventoryRelease.worker.js`
6. `workers/payout.worker.js`
7. `workers/product-bulk-create.worker.js`
8. `workers/product-bulk-update.worker.js`

## E) Critical Files To Convert Last

1. `modules/payments/webhook.routes.js`
2. `modules/payments/webhooks.controller.js`
3. `workers/payment-webhook.worker.js`
4. `middlewares/response.middleware.js`
5. `middlewares/error.middleware.js`
6. `middlewares/auth.middleware.js`
7. `utils/jwt.js`
