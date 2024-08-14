const express = require('express');
const router = express.Router();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'Documentation for your API endpoints',
        },
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

const authRouter = require('./auth');
const roleRouter = require('./role');
const userRouter = require('./user');
const fileRouter = require ('./file');

// Define routes
router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerSpec));

router.use('/api/v1.0/auth', authRouter);
router.use('/api/v1.0/role', roleRouter);
router.use('/api/v1.0/user', userRouter);
router.use('/api/v1.0/file',fileRouter);


module.exports = router;

