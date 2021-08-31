const Koa = require('koa')
const Router = require('@koa/router')
const logger = require('koa-logger')

const app = new Koa()
const router = new Router()
app.use(logger())

const activitiesData = require('./activitiesData')

router.get('/api/activities', (ctx, next) => {
  activitiesData.callingGetActivities()
  ctx.body = Object.values(activitiesData.getActivities())
});

router.get('/api/activities/:id', async (ctx, next) => {
  const id = +ctx.params.id

  activitiesData.callingGetActivity(id)

  if (id === 2) {
    await new Promise(resolve => setTimeout(resolve, 5000))
    ctx.body = activitiesData.getActivities()[id]
    return
  }

  if (id === 3) {
    if (activitiesData.getIsThreeError()) {
      ctx.status = 500
    } else {
      ctx.body = activitiesData.getActivities()[id]
    }
    return
  }

  if (activitiesData.getActivities()[id]) {
    ctx.body = activitiesData.getActivities()[id]
  } else {
    ctx.status = 400
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3001, () => {
  console.log('Server running at PORT 3001')
})