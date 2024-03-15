import express from 'express';
import userRouter from './user.route.js';
import authRouter from './auth.route.js';

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/users', userRouter);
router.use('/auth', authRouter);

export default router;
