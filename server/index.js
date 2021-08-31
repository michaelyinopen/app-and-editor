const Koa = require('koa')
const Router = require('@koa/router')

const app = new Koa();
const router = new Router()

router.get('/api/activities', (ctx, next) => {
  ctx.body = require('./activities').activities
});

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3001, () => {
  console.log('Server running at PORT 3001')
})