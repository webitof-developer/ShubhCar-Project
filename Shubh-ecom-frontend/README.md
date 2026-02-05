This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Project Structure

```
/src
  /app                 - Next.js app directory
    /products          - Product pages
    /categories        - Category pages
    /profile           - User profile pages
    /cart              - Shopping cart
    /contact           - Contact page
  
  /components          - React components
    /common            - Shared components
    /product           - Product-specific components
    /category          - Category-specific components
    /user              - User-specific components
  
  /services            - Data access layer
    categoryService.js - Category data operations
    productService.js  - Product data operations
    reviewService.js   - Review data operations
    userService.js     - User data operations
    orderService.js    - Order data operations
  
  /data                - Static mock data
    categories.js      - Mock category data
    products.js        - Mock product data
    reviews.js         - Mock review data
    users.js           - Mock user data
    orders.js          - Mock order data
  
  /lib                 - Utility functions
    pricing.js         - Dual pricing logic (retail/wholesale)
    analytics.js       - Google Analytics integration (placeholder)
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
