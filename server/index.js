const Koa = require('koa')
const Router = require('@koa/router')
const logger = require('koa-logger')
const bodyParser = require('koa-bodyparser')

const app = new Koa()
const router = new Router()
app.use(logger())
app.use(bodyParser())


const activitiesData = require('./activitiesData')

router.get('/api/activities', (ctx, next) => {
  activitiesData.callingGetActivities()
  ctx.body = activitiesData.getActivities()
})

router.get('/api/activities/:id', async (ctx, next) => {
  const id = parseInt(ctx.params.id)

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

  const activity = activitiesData.getActivity(id)
  if (activity) {
    ctx.body = activity
  } else {
    ctx.status = 404
  }
})

router.post('/api/activities', (ctx, next) => {
  const newActivity = ctx.request.body
  const addedActivity = activitiesData.addActivity(newActivity)
  ctx.status = 201
  ctx.body = addedActivity
})

router.delete('/api/activities/:id', (ctx, next) => {
  const id = parseInt(ctx.params.id)
  activitiesData.deleteActivity(id)
  ctx.status = 200
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3001, () => {
  console.log('Server running at PORT 3001')
})