import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'I-soft-Project API Documentation',
      version: '1.0.0',
      description: 'REST API documentation for Employee, Asset, Leave, and Attendance Management System',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './routes/**/*.js', './index.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
