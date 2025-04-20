import React, { useState, useEffect, useRef } from 'react'
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  CalendarEvent,
} from '../services/calendarSupabase'

/* ────────────────────────────────────────
   Front‑end shape (camelCase)
   ──────────────────────────────────────── */
interface Event {
  id: string
  title: string
  dayIndex: number
  startTime: string
  endTime: string
  color: string
  isDeepWork?: boolean
}

/* Helper to translate DB ↔ front‑end -------------------------- */
const dbToEvent = (db: CalendarEvent): Event => ({
  id: db.id,
  title: db.title,
  dayIndex: db.day_index,
  startTime: db.start_time,
  endTime: db.end_time,
  color: db.color,
  isDeepWork: db.is_deep_work ?? false,
})

const eventToDb = (
  ev: Event,
  weekIndex: number,
): Omit<CalendarEvent, 'id' | 'created_at'> => ({
  title: ev.title,
  day_index: ev.dayIndex,
  start_time: ev.startTime,
  end_time: ev.endTime,
  color: ev.color,
  is_deep_work: ev.isDeepWork ?? false,
  week_index: weekIndex,
})

export default function Calendar() {
  /* ------------------------- static calendar scaffold ------------------------ */
  const weeks = [
    [
      { date: 14, day: 'Sun' }, { date: 15, day: 'Mon' }, { date: 16, day: 'Tue' },
      { date: 17, day: 'Wed' }, { date: 18, day: 'Thu' }, { date: 19, day: 'Fri' },
      { date: 20, day: 'Sat' },
    ],
    [
      { date: 21, day: 'Sun' }, { date: 22, day: 'Mon' }, { date: 23, day: 'Tue' },
      { date: 24, day: 'Wed' }, { date: 25, day: 'Thu' }, { date: 26, day: 'Fri' },
      { date: 27, day: 'Sat' },
    ],
    [
      { date: 28, day: 'Sun' }, { date: 29, day: 'Mon' }, { date: 30, day: 'Tue' },
      { date: 1,  day: 'Wed' }, { date: 2,  day: 'Thu' }, { date: 3,  day: 'Fri' },
      { date: 4,  day: 'Sat' },
    ],
  ]

  const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const displayHour = hour % 12 || 12
        const period = hour < 12 ? 'AM' : 'PM'
        const formattedMinute = minute.toString().padStart(2, '0')
        slots.push(`${displayHour}:${formattedMinute} ${period}`)
      }
    }
    return slots
  }
  const timeSlots = generateTimeSlots()
  const slotHeight = 32

  /* ----------------------------- component state ----------------------------- */
  const [weekIndex, setWeekIndex] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newEvent, setNewEvent] = useState<{
    title: string
    dayIndex: number
    startTime: string
    endTime: string
    color: string
    isDeepWork: boolean
  }>({
    title: '',
    dayIndex: 0,
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    color: '#4285F4',
    isDeepWork: false,
  })

  const calendarRef = useRef<HTMLDivElement>(null)

  /* -------------------------- fetch events for the week ---------------------- */
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const dbEvents = await getCalendarEvents(weekIndex /*, userId */)
        if (mounted) setEvents(dbEvents.map(dbToEvent))
      } catch (err) {
        console.error('Failed to load calendar events', err)
      }
    })()
    return () => { mounted = false }
  }, [weekIndex])

  /* -------------------------- "Now" red line position ------------------------ */
  const [nowPos, setNowPos] = useState(0)
  useEffect(() => {
    const updateNow = () => {
      const n = new Date()
      const total = n.getHours() * 60 + n.getMinutes()
      setNowPos((total / 30) * slotHeight)
    }
    updateNow()
    const id = setInterval(updateNow, 60000)
    return () => clearInterval(id)
  }, [])

  /* --------------------------- deep‑work event hook -------------------------- */
  useEffect(() => {
    const handler = async (e: CustomEvent<{ start: Date; end: Date }>) => {
      const { start, end } = e.detail
      const col = weeks[weekIndex].findIndex(d => d.date === start.getDate())
      const fmt = (d: Date) => {
        let h = d.getHours()
        const m = d.getMinutes().toString().padStart(2, '0')
        const pm = h >= 12
        if (h > 12) h -= 12
        if (h === 0) h = 12
        return `${h}:${m} ${pm ? 'PM' : 'AM'}`
      }

      /* save in DB then local state */
      try {
        const saved = await createCalendarEvent({
          ...eventToDb(
            {
              id: '',
              title: 'Deep Work',
              dayIndex: col >= 0 ? col : 0,
              startTime: fmt(start),
              endTime: fmt(end),
              color: '#FF7043',
              isDeepWork: true,
            },
            weekIndex,
          ),
        })
        setEvents(evts => [...evts, dbToEvent(saved)])
      } catch (err) {
        console.error('Failed to create Deep Work event', err)
      }
    }

    window.addEventListener('deepworkEvent', handler as any)
    return () => window.removeEventListener('deepworkEvent', handler as any)
  }, [weekIndex])

  /* --------------- update current date label when week changes -------------- */
  useEffect(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekIndex * 7)
    setCurrentDate(d)
  }, [weekIndex])

  /* ------------------------------- helpers ---------------------------------- */
  const isToday = (date: number) => {
    const t = new Date()
    return (
      date === t.getDate() &&
      currentDate.getMonth() === t.getMonth() &&
      currentDate.getFullYear() === t.getFullYear()
    )
  }

  const timeToPosition = (time: string) => {
    const [tp, period] = time.split(' ')
    let [h, m] = tp.split(':').map(Number)
    h = h % 12 + (period === 'PM' && h !== 12 ? 12 : 0)
    return ((h * 60 + m) / 30) * slotHeight
  }

  /* --------------------------- CRUD handlers -------------------------------- */
  const handleTimeSlotClick = (dayIndex: number, timeIdx: number) => {
    const start = timeSlots[timeIdx]
    const end = timeSlots[Math.min(timeIdx + 2, timeSlots.length - 1)]
    setNewEvent({
      title: '',
      dayIndex,
      startTime: start,
      endTime: end,
      color: '#4285F4',
      isDeepWork: false,
    })
    setIsEditing(true)
  }

  const handleCreateEvent = async () => {
    const title = newEvent.isDeepWork ? 'Deep Work' : newEvent.title.trim()
    if (!title) return
    const color = newEvent.isDeepWork ? '#FF7043' : newEvent.color

    try {
      const saved = await createCalendarEvent(
        eventToDb(
          {
            id: '',
            title,
            dayIndex: newEvent.dayIndex,
            startTime: newEvent.startTime,
            endTime: newEvent.endTime,
            color,
            isDeepWork: newEvent.isDeepWork,
          },
          weekIndex,
        ),
      )
      setEvents(evts => [...evts, dbToEvent(saved)])
      setIsEditing(false)
    } catch (err) {
      console.error('Error creating calendar event', err)
    }
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return
    try {
      const updated = await updateCalendarEvent(
        selectedEvent.id,
        eventToDb(selectedEvent, weekIndex),
      )
      setEvents(evts =>
        evts.map(ev => (ev.id === updated.id ? dbToEvent(updated) : ev)),
      )
      setSelectedEvent(null)
    } catch (err) {
      console.error('Error updating calendar event', err)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    try {
      await deleteCalendarEvent(selectedEvent.id)
      setEvents(evts => evts.filter(ev => ev.id !== selectedEvent.id))
      setSelectedEvent(null)
    } catch (err) {
      console.error('Error deleting event', err)
    }
  }

  const handleEventClick = (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(ev)
  }

  const handleTimeChange = (
    time: string,
    isStart: boolean,
    type: 'new' | 'existing',
  ) => {
    if (type === 'new') {
      setNewEvent(ne => ({
        ...ne,
        [isStart ? 'startTime' : 'endTime']: time,
      }))
    } else if (selectedEvent) {
      setSelectedEvent(se => ({
        ...se!,
        [isStart ? 'startTime' : 'endTime']: time,
      }))
    }
  }

  /* ---------------------- renderer helpers (unchanged) ---------------------- */
  const renderEvents = (dayIdx: number) =>
    events
      .filter(ev => ev.dayIndex === dayIdx)
      .map(event => {
        const top = timeToPosition(event.startTime) + 16
        const height =
          timeToPosition(event.endTime) - timeToPosition(event.startTime)
        return (
          <div
            key={event.id}
            onClick={e => handleEventClick(event, e)}
            className="absolute mx-3 rounded-xl p-3 text-white text-sm shadow-sm cursor-pointer overflow-hidden"
            style={{
              top: `${top}px`,
              height: `${Math.max(height, 64)}px`,
              left: 0,
              right: 0,
              backgroundColor: event.color,
            }}
          >
            <div className="font-medium truncate">{event.title}</div>
            <div className="text-xs opacity-90 truncate">
              {event.startTime} – {event.endTime}
            </div>
          </div>
        )
      })

  const ModalOverlay = ({
    children,
    onClose,
  }: {
    children: React.ReactNode
    onClose?: () => void
  }) => (
    <div
      className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50"
      onMouseDown={onClose}
    >
      <div onMouseDown={e => e.stopPropagation()}>{children}</div>
    </div>
  )
  const ModalContent = ({
    children,
    title,
  }: {
    children: React.ReactNode
    title: string
  }) => (
    <div className="bg-[#242424] rounded-xl shadow-xl w-full max-w-md text-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
        {children}
      </div>
    </div>
  )

  return (
    <div className="bg-[#181414] min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            Weekly Calendar
          </h1>
          <p className="text-md text-gray-300">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekIndex(w => Math.max(0, w - 1))}
            disabled={weekIndex === 0}
            className="px-4 py-2 bg-[#242424] text-white border border-gray-700 rounded-lg disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            onClick={() => setWeekIndex(0)}
            className="px-4 py-2 bg-[#242424] text-white border border-gray-700 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={() => setWeekIndex(w => Math.min(weeks.length - 1, w + 1))}
            disabled={weekIndex === weeks.length - 1}
            className="px-4 py-2 bg-[#242424] text-white border border-gray-700 rounded-lg disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="border border-gray-700 rounded-lg overflow-hidden shadow-sm bg-[#181414] relative"
        ref={calendarRef}
      >
        {/* Header Row */}
        <div className="grid grid-cols-8 bg-[#242424]">
          <div className="border-r border-b border-gray-700" />
          {weeks[weekIndex].map((d, i) => (
            <div
              key={i}
              className={`p-2 border-b border-gray-700 text-center ${
                isToday(d.date) ? 'bg-[#1B3B29]' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-300">{d.day}</div>
              <div
                className={`mt-1 w-8 h-8 flex items-center justify-center mx-auto rounded-full ${
                  isToday(d.date) ? 'bg-[#1B3B29] text-white' : 'text-white'
                }`}
              >
                {d.date}
              </div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="h-[768px] overflow-y-auto grid grid-cols-8 relative pt-8">
          {/* Time labels */}
          <div className="flex flex-col">
            {timeSlots.map((slot, idx) => (
              <div
                key={idx}
                className="h-8 border-r border-gray-700 flex items-center justify-end pr-2 bg-[#181414]"
              >
                {idx % 2 === 0 && (
                  <span className="text-xs text-gray-400">{slot}</span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weeks[weekIndex].map((_, dayIdx) => (
            <div key={dayIdx} className="flex flex-col relative">
              {timeSlots.map((_, tIdx) => (
                <div
                  key={tIdx}
                  className="h-8 border-b border-gray-700 hover:bg-[#242424] cursor-pointer bg-[#181414]"
                  onClick={() => handleTimeSlotClick(dayIdx, tIdx)}
                />
              ))}
              {renderEvents(dayIdx)}
            </div>
          ))}

          {/* "Now" line */}
          {weekIndex === 0 && (
            <div
              className="absolute bg-red-500 h-[2px] z-10"
              style={{
                top: `${nowPos + 16}px`,
                left: `calc(100%/8)`, 
                width: `calc((100%/8)*7)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isEditing && (
        <ModalOverlay onClose={() => setIsEditing(false)}>
          <ModalContent title="Create New Event">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  autoFocus
                  disabled={newEvent.isDeepWork}
                  className={`w-full p-2 border rounded-lg focus:ring-2 ${
                    newEvent.isDeepWork
                      ? 'bg-gray-700 border-gray-700 cursor-not-allowed'
                      : 'bg-[#242424] border-gray-700 focus:ring-[#1B3B29]'
                  } text-white`}
                  value={newEvent.title}
                  onChange={e => setNewEvent(ne => ({ ...ne, title: e.target.value }))}
                />
              </div>
              {/* Start & End */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Time
                  </label>
                  <select
                    className="w-full p-2 border border-gray-700 rounded-lg bg-[#242424] text-white"
                    value={newEvent.startTime}
                    onChange={e => handleTimeChange(e.target.value, true, 'new')}
                  >
                    {timeSlots.map((s, i) => (
                      <option key={i} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Time
                  </label>
                  <select
                    className="w-full p-2 border border-gray-700 rounded-lg bg-[#242424] text-white"
                    value={newEvent.endTime}
                    onChange={e => handleTimeChange(e.target.value, false, 'new')}
                  >
                    {timeSlots.map((s, i) => (
                      <option
                        key={i}
                        value={s}
                        disabled={timeToPosition(s) <= timeToPosition(newEvent.startTime)}
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Event Color
                </label>
                <input
                  type="color"
                  value={newEvent.color}
                  onChange={e => setNewEvent(ne => ({ ...ne, color: e.target.value }))}
                  className="w-12 h-8 p-0 border-0 bg-transparent"
                />
              </div>
              {/* Deep Work */}
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newEvent.isDeepWork}
                  onChange={e => setNewEvent(ne => ({ ...ne, isDeepWork: e.target.checked }))}
                  className="h-4 w-4 text-[#FF7043] rounded bg-[#242424]"
                />
                <span className="text-sm text-gray-300">Deep Work?</span>
              </label>
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-[#1a1a1a]"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#1B3B29] text-white rounded-lg hover:bg-[#152b1f]"
                  onClick={handleCreateEvent}
                >
                  Create Event
                </button>
              </div>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Edit Modal */}
      {selectedEvent && (
        <ModalOverlay onClose={() => setSelectedEvent(null)}>
          <ModalContent title="Edit Event">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  autoFocus
                  disabled={!!selectedEvent.isDeepWork}
                  className={`w-full p-2 border rounded-lg focus:ring-2 ${
                    selectedEvent.isDeepWork
                      ? 'bg-gray-700 border-gray-700 cursor-not-allowed'
                      : 'bg-[#242424] border-gray-700 focus:ring-[#1B3B29]'
                  } text-white`}
                  value={selectedEvent.title}
                  onChange={e => setSelectedEvent(se => se && ({ ...se, title: e.target.value }))}
                />
              </div>
              {/* Start & End */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Time
                  </label>
                  <select
                    className="w-full p-2 border border-gray-700 rounded-lg bg-[#242424] text-white"
                    value={selectedEvent.startTime}
                    onChange={e => handleTimeChange(e.target.value, true, 'existing')}
                  >
                    {timeSlots.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Time
                  </label>
                  <select
                    className="w-full p-2 border border-gray-700 rounded-lg bg-[#242424] text-white"
                    value={selectedEvent.endTime}
                    onChange={e => handleTimeChange(e.target.value, false, 'existing')}
                  >
                    {timeSlots.map((s, i) => (
                      <option
                        key={i}
                        value={s}
                        disabled={timeToPosition(s) <= timeToPosition(selectedEvent.startTime)}
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Event Color
                </label>
                <input
                  type="color"
                  value={selectedEvent.color}
                  onChange={e => setSelectedEvent(se => se && ({ ...se, color: e.target.value }))}
                  className="w-12 h-8 p-0 border-0 bg-transparent"
                />
              </div>
              {/* Deep Work */}
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!selectedEvent.isDeepWork}
                  onChange={e => setSelectedEvent(se => se && ({ ...se, isDeepWork: e.target.checked }))}
                  className="h-4 w-4 text-[#FF7043] rounded bg-[#242424]"
                />
                <span className="text-sm text-gray-300">Deep Work?</span>
              </label>
              {/* Actions */}
              <div className="flex justify-between pt-4">
                <button
                  className="px-4 py-2 text-red-500 border border-gray-700 rounded-lg hover:bg-[#2a2020]"
                  onClick={handleDeleteEvent}
                >
                  Delete
                </button>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-[#1a1a1a]"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[#1B3B29] text-white rounded-lg hover:bg-[#152b1f]"
                    onClick={handleUpdateEvent}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  )
}