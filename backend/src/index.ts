import { createApp } from './app.js';
import { ENV } from './infrastructure/config/env.js';

const app = createApp();
const PORT = parseInt(ENV.PORT, 10) || 5000;

app.listen(PORT, () => {
  console.log(`MichiMochi Dedicated Backend running on http://localhost:${PORT}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
});
