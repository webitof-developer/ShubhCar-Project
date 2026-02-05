const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SpareParts E-commerce API',
    version: '1.0.0',
    description:
      'Public API documentation for the SpareParts ecommerce platform covering catalog, authentication, cart, orders, and CMS endpoints.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      GenericSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'integer', description: 'Access token expiry in seconds' },
        },
      },
      ProductSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          price: { type: 'number', format: 'float' },
          currency: { type: 'string', example: 'USD' },
          thumbnailUrl: { type: 'string', format: 'uri' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          parentId: { type: 'string', nullable: true },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          itemId: { type: 'string' },
          productId: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          price: { type: 'number', format: 'float' },
          currency: { type: 'string', example: 'USD' },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartItem' },
          },
          subtotal: { type: 'number', format: 'float' },
          discounts: { type: 'number', format: 'float' },
          total: { type: 'number', format: 'float' },
          currency: { type: 'string', example: 'USD' },
          couponCode: { type: 'string', nullable: true },
        },
      },
      OrderSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string', example: 'processing' },
          paymentStatus: { type: 'string', example: 'paid' },
          total: { type: 'number', format: 'float' },
          currency: { type: 'string', example: 'USD' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                name: { type: 'string' },
                quantity: { type: 'integer' },
                price: { type: 'number', format: 'float' },
              },
            },
          },
        },
      },
      PageContent: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          published: { type: 'boolean' },
        },
      },
      SeoResolution: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          canonicalUrl: { type: 'string', format: 'uri' },
          image: { type: 'string', format: 'uri', nullable: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string' },
          status: { type: 'string' },
        },
      },
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string' },
          phone: { type: 'string' },
          line1: { type: 'string' },
          line2: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
          country: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          price: { type: 'number', format: 'float' },
          images: { type: 'array', items: { type: 'string' } },
        },
      },
      ProductImage: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          productId: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          alt: { type: 'string' },
          position: { type: 'integer' },
        },
      },
      AttributeValue: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          attributeId: { type: 'string' },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
      Shipment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderItemId: { type: 'string' },
          carrier: { type: 'string' },
          trackingNumber: { type: 'string' },
          status: { type: 'string' },
          eta: { type: 'string', format: 'date' },
        },
      },
      ShipmentTracking: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          trackingNumber: { type: 'string' },
          trackingUrl: { type: 'string', format: 'uri', nullable: true },
          shippedAt: { type: 'string', format: 'date-time', nullable: true },
          estimatedDeliveryDate: { type: 'string', format: 'date', nullable: true },
          deliveredAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      OrderNote: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderId: { type: 'string' },
          noteType: { type: 'string', enum: ['system', 'private', 'customer'] },
          noteContent: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Return: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderId: { type: 'string' },
          status: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                orderItemId: { type: 'string' },
                vendorId: { type: 'string' },
                quantity: { type: 'integer' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      PaymentIntent: {
        type: 'object',
        properties: {
          paymentId: { type: 'string' },
          clientSecret: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
        },
      },
      Coupon: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string' },
          discountType: { type: 'string' },
          amount: { type: 'number' },
        },
      },
      ShippingRule: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          rate: { type: 'number' },
          conditions: { type: 'object' },
        },
      },
      TaxSlab: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          rate: { type: 'number' },
          inclusive: { type: 'boolean' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          status: { type: 'string' },
        },
      },
      Entry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string' },
          read: { type: 'boolean' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          brandId: { type: 'string' },
          modelId: { type: 'string' },
          variantId: { type: 'string' },
          year: { type: 'integer' },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [path.join(__dirname, '../modules/**/*.routes.js')],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
