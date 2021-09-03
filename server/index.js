const Koa = require('koa')
const Router = require('@koa/router')
const logger = require('koa-logger')
const bodyParser = require('koa-bodyparser')

const app = new Koa()
const router = new Router()
app.use(logger())
app.use(bodyParser())


const activitiesData = require('./activitiesData')

router.post('/api/reset', (ctx, next) => {
  activitiesData.reset()
  ctx.status = 200
})

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

router.put('/api/activities/:id', (ctx, next) => {
  const updatingActivity = ctx.request.body
  const { status, activity, updatedActivity } = activitiesData.updateActivity(updatingActivity)
  if (status === 'not found') {
    ctx.status = 200
    ctx.body = { status: 'not found' }
  } else if (status === 'version condition failed') {
    ctx.status = 200
    ctx.body = { status: 'version condition failed', activity }
  } else if (status === 'done') {
    ctx.status = 200
    ctx.body = { status: 'done', updatedActivity }
    return
  }
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