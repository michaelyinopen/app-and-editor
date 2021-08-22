import { rest } from 'msw'

export const handlers = [
  rest.get('/activities', (req, res, ctx) => {
    return res(
      // Respond with a 200 status code
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          name: 'some activity',
          person: 'some person',
          place: 'some place',
          cost: 99
        }
      ]),
    )
  }),
]