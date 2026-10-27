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

export function createDefaultScheduleItems(project = {}) {
  return [
    {
      item_time: normalizeTime(project.ceremony_time),
      item_title: 'Svadobný obrad',
      item_description: project.venue_name || '',
    },
    {
      item_time: normalizeTime(project.reception_time),
      item_title: 'Svadobná oslava',
      item_description: project.reception_venue_name || '',
    },
  ]
}

export function withDefaultScheduleItems(items, project = {}) {
  return Array.isArray(items) && items.length > 0
    ? items
    : createDefaultScheduleItems(project)
}

function getScheduleTimeMinutes(item) {
  const value = item?.item_time ?? item?.time
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)

  if (!match) {
    return Number.POSITIVE_INFINITY
  }

  return Number(match[1]) * 60 + Number(match[2])
}

function normalizeTime(value) {
  const match = String(value || '').match(/^(\d{2}:\d{2})/)
  return match?.[1] || ''
}
