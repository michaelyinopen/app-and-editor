import { rest } from 'msw'

let activityThreeErrorMarker = 0
let activityFourUpdateMarker = 0

export const handlers = [
  rest.get('/api/activities', (req, res, ctx) => {
    activityFourUpdateMarker = activityFourUpdateMarker + 1
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
          name: 'error for two thirds',
          versionToken: '1',
        },
        {
          id: 4,
          name: 'update every third',
          versionToken: Math.floor(activityFourUpdateMarker / 3).toString(),
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
      activityThreeErrorMarker = activityThreeErrorMarker + 1
      if (activityThreeErrorMarker % 3 === 0) {
        return res(
          ctx.delay(),
          ctx.status(200),
          ctx.json({
            id: 3,
            name: 'error for two thirds',
            person: 'resolver',
            place: 'happy',
            cost: 3838,
            versionToken: '1',
          }),
        )
      } else {
        return res(
          ctx.delay(),
          ctx.status(500),
        )
      }
    } else if (id === '4') {
      activityFourUpdateMarker = activityFourUpdateMarker + 1
      return res(
        ctx.delay(),
        ctx.status(200),
        ctx.json({
          id: 4,
          name: 'might update',
          person: 'chance',
          place: 'casino',
          cost: (Math.floor(activityFourUpdateMarker / 3) + 1),
          versionToken: (Math.floor(activityFourUpdateMarker / 3) + 1).toString(),
        }),
      )
    }
  }),
]