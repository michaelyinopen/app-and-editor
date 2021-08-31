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

//#region utilities for tirst four activities
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
//#endregion utilities for tirst four activities

module.exports.getActivities = () => {
  return Object.values(activities).map(a => ({
    id: a.id,
    name: a.name,
    versionToken: a.versionToken,
  }))
}

module.exports.getActivity = (id) => {
  return activities[id]
}

let nextId = Math.max(...Object.keys(activities)) + 1

const getNextIdAndIncrement = () => {
  const result = nextId
  nextId = nextId + 1
  return result
}

module.exports.addActivity = (activity) => {
  const id = getNextIdAndIncrement()
  const activityWithId = {
    ...activity,
    id,
    versionToken: '1'
  }
  activities[id] = activityWithId
  return activityWithId
}

module.exports.updateActivity = (id, activity) => {
  const activityWithId = {
    ...activity,
    id,
    versionToken: (parseInt(activity) + 1).toString
  }
  activities[id] = activityWithId
  return activityWithId
}

module.exports.deleteActivity = (id) => {
  const { [id]: deleteActivity, ...remainingActivities } = activities
  activities = remainingActivities
}