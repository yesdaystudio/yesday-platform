export function sortScheduleItemsChronologically(items = []) {
  return items
    .map((item, index) => ({
      item,
      index,
      minutes: getScheduleTimeMinutes(item),
    }))
    .sort((first, second) => {
      if (first.minutes !== second.minutes) {
        return first.minutes - second.minutes
      }

      return first.index - second.index
    })
    .map(({ item }) => item)
}

function getScheduleTimeMinutes(item) {
  const value = item?.item_time ?? item?.time
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)

  if (!match) {
    return Number.POSITIVE_INFINITY
  }

  return Number(match[1]) * 60 + Number(match[2])
}
