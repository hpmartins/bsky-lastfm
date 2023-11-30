import { handler } from './build/handler.js';
import express from 'express';
import 'dotenv/config';

const app = express();

const port = process.env.PORT ?? 8000;

app.use(handler);

app.listen(port, () => {
    console.log(`[${new Date().toLocaleTimeString()}] [musica] listening on port ${port}`);
});
