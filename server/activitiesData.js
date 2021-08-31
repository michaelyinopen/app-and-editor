let activityThreeErrorMarker = 0
let activityFourUpdateMarker = 0

let activities = {
  1: {
    id: 1,
    name: 'some activity',
    person: 'some person',
    place: 'some place',
    cost: 99,
    versionToken: '1',
  },
  2: {
    id: 2,
    name: 'slow',
    person: 'snail',
    place: 'leaf',
    cost: 8,
    versionToken: '1',
  },
  3: {
    id: 3,
    name: 'error for two thirds',
    person: 'resolver',
    place: 'happy',
    cost: 3838,
    versionToken: '1',
  },
  4: {
    id: 4,
    name: 'might update',
    person: 'chance',
    place: 'casino',
    cost: Math.floor(activityFourUpdateMarker / 3) + 1,
    versionToken: (Math.floor(activityFourUpdateMarker / 3) + 1).toString(),
  }
}

function incrementActivityFourUpdateMarker() {
  activityFourUpdateMarker = activityFourUpdateMarker + 1
  if (activities[4]) {
    activities = {
      ...activities,
      4: {
        id: 4,
        name: 'might update',
        person: 'chance',
        place: 'casino',
        cost: (Math.floor(activityFourUpdateMarker / 3) + 1),
        versionToken: (Math.floor(activityFourUpdateMarker / 3) + 1).toString(),
      }
    }
  }
}

module.exports.getActivities = () => activities

module.exports.callingGetActivities = () => {
  incrementActivityFourUpdateMarker()
}

module.exports.callingGetActivity = (id) => {
  if (id === 3) {
    activityThreeErrorMarker = activityThreeErrorMarker + 1
  } else if (id === 4) {
    incrementActivityFourUpdateMarker()
  }
}

module.exports.getIsThreeError = () => activityThreeErrorMarker % 3 !== 0