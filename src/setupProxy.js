const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  if (!process.env.REACT_APP_MSW_MOCK) {
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:3001',
        changeOrigin: true,
      })
    );
  }
};