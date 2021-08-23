import { rest } from 'msw'

export const handlers = [
  rest.get('/api/activities', (req, res, ctx) => {
    return res(
      ctx.delay(),
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          name: 'some activity',
        },
        {
          id: 2,
          name: 'slow',
        },
        {
          id: 3,
          name: 'error',
        }
      ]),
    )
  }),

  rest.get('/api/activities/:id', (req, res, ctx) => {
    const { id } = req.params
    if (id === '1') {
      return res(
        ctx.delay(),
        ctx.status(200),
        ctx.json({
          id: 1,
          name: 'some activity',
          person: 'some person',
          place: 'some place',
          cost: 99
        }),
      )
    } else if (id === '2') {
      return res(
        ctx.delay(5000),
        ctx.status(200),
        ctx.json({
          id: 2,
          name: 'slow',
          person: 'snail',
          place: 'leaf',
          cost: 8
        }),
      )
    } else if (id === '3') {
      return res(
        ctx.delay(),
        ctx.status(500),
      )
    }
  }),
]