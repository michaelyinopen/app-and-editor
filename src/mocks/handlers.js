import { rest } from 'msw'

let remaingFailedAttemptsOfActivityThree = 3
let versionTokenOfActivityFour = 1

export const handlers = [
  rest.get('/api/activities', (req, res, ctx) => {
    if (Math.random() > 0.5) {
      versionTokenOfActivityFour = versionTokenOfActivityFour + 1
    }
    return res(
      ctx.delay(),
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          name: 'some activity',
          versionToken: '1',
        },
        {
          id: 2,
          name: 'slow',
          versionToken: '1',
        },
        {
          id: 3,
          name: 'error for some times',
          versionToken: '1',
        },
        {
          id: 4,
          name: 'might update',
          versionToken: versionTokenOfActivityFour.toString(),
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
          cost: 99,
          versionToken: '1',
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
          cost: 8,
          versionToken: '1',
        }),
      )
    } else if (id === '3') {
      if (remaingFailedAttemptsOfActivityThree <= 0) {
        return res(
          ctx.delay(),
          ctx.status(200),
          ctx.json({
            id: 3,
            name: 'error for some times',
            person: 'resolver',
            place: 'happy',
            cost: 3838,
            versionToken: '1',
          }),
        )
      } else {
        remaingFailedAttemptsOfActivityThree = remaingFailedAttemptsOfActivityThree - 1
        return res(
          ctx.delay(),
          ctx.status(500),
        )
      }
    } else if (id === '4') {
      if (Math.random() > 0.5) {
        versionTokenOfActivityFour = versionTokenOfActivityFour + 1
      }
      return res(
        ctx.delay(),
        ctx.status(200),
        ctx.json({
          id: 4,
          name: 'might update',
          person: 'chance',
          place: 'casino',
          cost: versionTokenOfActivityFour,
          versionToken: versionTokenOfActivityFour.toString(),
        }),
      )
    }
  }),
]