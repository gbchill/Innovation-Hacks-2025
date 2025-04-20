import { useState, useEffect, useRef } from "react";

interface Event {
  id: string;
  title: string;
  dayIndex: number;
  startTime: string;
  endTime: string;
  color: string;
}

function Calendar() {
  const weeks = [
    [
      { date: 14, day: "Sun" },
      { date: 15, day: "Mon" },
      { date: 16, day: "Tue" },
      { date: 17, day: "Wed" },
      { date: 18, day: "Thu" },
      { date: 19, day: "Fri" },
      { date: 20, day: "Sat" },
    ],
    [
      { date: 21, day: "Sun" },
      { date: 22, day: "Mon" },
      { date: 23, day: "Tue" },
      { date: 24, day: "Wed" },
      { date: 25, day: "Thu" },
      { date: 26, day: "Fri" },
      { date: 27, day: "Sat" },
    ],
    [
      { date: 28, day: "Sun" },
      { date: 29, day: "Mon" },
      { date: 30, day: "Tue" },
      { date: 1, day: "Wed" },
      { date: 2, day: "Thu" },
      { date: 3, day: "Fri" },
      { date: 4, day: "Sat" },
    ],
  ];

  // Generate time slots with 30-minute intervals and proper 12 AM formatting
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const displayHour = hour % 12 || 12;
        const period = hour < 12 ? "AM" : "PM";
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${displayHour}:${formattedMinute} ${period}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const slotHeight = 32; // Each 30-minute slot is 32px tall

  const [weekIndex, setWeekIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    dayIndex: 0,
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    color: "#4285F4",
  });

  const eventColors = ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#673AB7"];
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + (weekIndex * 7));
    setCurrentDate(newDate);
  }, [weekIndex]);

  const isToday = (date: number) => {
    const today = new Date();
    return (
      date === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Convert time string to position in pixels
  const timeToPosition = (time: string) => {
    const [timePart, period] = time.split(" ");
    const [hours, minutes] = timePart.split(":").map(Number);
    let hour = hours;
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return (hour * 2 + (minutes / 30)) * slotHeight;
  };

  const handleTimeSlotClick = (dayIndex: number, timeSlotIndex: number) => {
    const startTime = timeSlots[timeSlotIndex];
    const endTime = timeSlots[Math.min(timeSlotIndex + 2, timeSlots.length - 1)]; // Default 1 hour duration
    
    setNewEvent({
      title: "",
      dayIndex,
      startTime,
      endTime,
      color: eventColors[Math.floor(Math.random() * eventColors.length)],
    });
    setIsEditing(true);
  };

  const handleCreateEvent = () => {
    if (!newEvent.title.trim()) return;
    
    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      dayIndex: newEvent.dayIndex,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color,
    };
    
    setEvents([...events, event]);
    setIsEditing(false);
    setNewEvent({
      title: "",
      dayIndex: 0,
      startTime: "9:00 AM",
      endTime: "10:00 AM",
      color: "#4285F4",
    });
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const handleUpdateEvent = () => {
    if (!selectedEvent) return;
    
    setEvents(events.map(e => 
      e.id === selectedEvent.id ? selectedEvent : e
    ));
    setSelectedEvent(null);
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    setEvents(events.filter(e => e.id !== selectedEvent.id));
    setSelectedEvent(null);
  };

  const renderEvents = () =>
    events.map(event => {
      const top = timeToPosition(event.startTime) + 16;
      const height = timeToPosition(event.endTime) - timeToPosition(event.startTime);
      const minHeight = 64;
  
      return (
        <div
          key={event.id}
          onClick={e => handleEventClick(event, e)}
          className="absolute mx-3 rounded-xl p-3 text-white text-sm shadow-sm cursor-pointer overflow-hidden"
          style={{
            top: `${top}px`,
            left: `0`,
            width: '120px',
            height: `${Math.max(height, minHeight)}px`,
            backgroundColor: event.color,
          }}
        >
          <div className="font-medium truncate">{event.title}</div>
          <div className="text-xs opacity-90 truncate">
            {event.startTime} – {event.endTime}
          </div>
        </div>
      );
    });
  
  const handleTimeChange = (time: string, isStartTime: boolean, eventType: 'new' | 'existing') => {
    if (eventType === 'new') {
      setNewEvent(prev => ({
        ...prev,
        [isStartTime ? "startTime" : "endTime"]: time
      }));
    } else if (selectedEvent) {
      setSelectedEvent(prev => ({
        ...prev!,
        [isStartTime ? "startTime" : "endTime"]: time
      }));
    }
  };
  const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) => (
    <div
      className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50"
      onMouseDown={onClose}           // <-- fires when you click anywhere outside
    >
      {/* wrap the content so no inner mouseDown ever bubbles out */}
      <div onMouseDown={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  const ModalContent = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-[#1B3B29] mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );

  const renderTimeLabels = () => {
    return timeSlots.map((slot, idx) => (
      <div
        key={`time-${idx}`}
        className="h-8 border-r border-[#E0E0E0] flex items-center justify-end pr-2 bg-[#F7F5EF]"
      >
        {idx % 2 === 0 && (
          <span className="text-xs text-[#70757A]">
            {slot}
          </span>
        )}
      </div>
    ));
  };

  return (
    <div className="bg-[#F7F5EF] min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1B3B29] mb-1">
              Weekly Calendar
            </h1>
            <p className="text-md text-[#5F6368]">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekIndex(p => Math.max(0, p - 1))}
              disabled={weekIndex === 0}
              className="px-4 py-2 bg-white text-[#1B3B29] border border-[#DADCE0] rounded-lg hover:bg-[#F1F3F4] transition disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={() => setWeekIndex(0)}
              className="px-4 py-2 bg-white text-[#1B3B29] border border-[#DADCE0] rounded-lg hover:bg-[#F1F3F4] transition"
            >
              Today
            </button>
            <button
              onClick={() => setWeekIndex(p => Math.min(weeks.length - 1, p + 1))}
              disabled={weekIndex === weeks.length - 1}
              className="px-4 py-2 bg-white text-[#1B3B29] border border-[#DADCE0] rounded-lg hover:bg-[#F1F3F4] transition disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div 
          className="border border-[#E0E0E0] rounded-lg overflow-hidden shadow-sm bg-[#F7F5EF]"
          ref={calendarRef}
        >
          {/* Calendar Header Row */}
          <div className="grid grid-cols-8 bg-[#FAFAFA]">
            <div className="border-r border-b border-[#E0E0E0]"></div>
            {weeks[weekIndex].map((dayObj, idx) => (
              <div 
                key={`${dayObj.date}-${idx}`} 
                className={`p-2 border-b border-[#E0E0E0] text-center ${isToday(dayObj.date) ? 'bg-[#E6F4EA]' : ''}`}
              >
                <div className="text-[#70757A] text-sm font-medium">{dayObj.day}</div>
                <div className={`mt-1 w-8 h-8 flex items-center justify-center mx-auto rounded-full ${isToday(dayObj.date) ? 'bg-[#1B3B29] text-white' : 'text-[#3C4043]'}`}>
                  {dayObj.date}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-8 relative pt-8">
            {/* Time Labels */}
            <div className="flex flex-col">
              {renderTimeLabels()}
            </div>

            {/* Calendar Columns */}
            {weeks[weekIndex].map((_, dayIdx) => (
              <div key={`day-${dayIdx}`} className="flex flex-col relative">
                {timeSlots.map((_, timeIdx) => (
                  <div
                    key={`slot-${dayIdx}-${timeIdx}`}
                    className={`h-8 border-b border-[#E0E0E0] ${timeIdx === 0 ? 'border-t-0' : ''} hover:bg-[#EDECE8] transition cursor-pointer bg-[#F7F5EF]`}
                    onClick={() => handleTimeSlotClick(dayIdx, timeIdx)}
                  />
                ))}
                {renderEvents()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Creation Modal */}
      {isEditing && (
  <ModalOverlay onClose={() => setIsEditing(false)}>
    <ModalContent title="Create New Event">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[#5F6368] mb-1">
            Title
          </label>
          <input
            type="text"
            autoFocus
            className="w-full p-2 border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1B3B29]"
            value={newEvent.title}
            onChange={e => setNewEvent(ne => ({ ...ne, title: e.target.value }))}
            onMouseDown={e => e.stopPropagation()}
            placeholder="Event title"
          />
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#5F6368] mb-1">
              Start Time
            </label>
            <select
              className="w-full p-2 border border-[#DADCE0] rounded-lg"
              value={newEvent.startTime}
              onChange={e => handleTimeChange(e.target.value, true, "new")}
              onMouseDown={e => e.stopPropagation()}
            >
              {timeSlots.map((slot, idx) => (
                <option key={idx} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5F6368] mb-1">
              End Time
            </label>
            <select
              className="w-full p-2 border border-[#DADCE0] rounded-lg"
              value={newEvent.endTime}
              onChange={e => handleTimeChange(e.target.value, false, "new")}
              onMouseDown={e => e.stopPropagation()}
            >
              {timeSlots.map((slot, idx) => (
                <option
                  key={idx}
                  value={slot}
                  disabled={timeToPosition(slot) <= timeToPosition(newEvent.startTime)}
                >
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            className="px-4 py-2 border rounded-lg text-[#5F6368]"
            onMouseDown={e => { e.stopPropagation(); setIsEditing(false); }}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-[#1B3B29] text-white rounded-lg"
            onMouseDown={e => {
              e.stopPropagation();
              handleCreateEvent();
            }}
          >
            Create Event
          </button>
        </div>
      </div>
    </ModalContent>
  </ModalOverlay>
)}

      {/* Event Details Modal */}
      {selectedEvent && (
        <ModalOverlay onClose={() => setSelectedEvent(null)}>
          <ModalContent title="Event Details">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5F6368] mb-1">Title</label>
                <input
                  type="text"
                  className="w-full p-2 border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1B3B29] focus:border-transparent"
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5F6368] mb-1">Start Time</label>
                  <select
                    className="w-full p-2 border border-[#DADCE0] rounded-lg"
                    value={selectedEvent.startTime}
                    onChange={(e) => handleTimeChange(e.target.value, true, 'existing')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {timeSlots.map((slot, idx) => (
                      <option key={`edit-start-${idx}`} value={slot}>
                        {slot === "12:00 AM" ? "12:00 AM" : slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5F6368] mb-1">End Time</label>
                  <select
                    className="w-full p-2 border border-[#DADCE0] rounded-lg"
                    value={selectedEvent.endTime}
                    onChange={(e) => handleTimeChange(e.target.value, false, 'existing')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {timeSlots.map((slot, idx) => (
                      <option 
                        key={`edit-end-${idx}`} 
                        value={slot}
                        disabled={timeToPosition(slot) <= timeToPosition(selectedEvent.startTime)}
                      >
                        {slot === "12:00 AM" ? "12:00 AM" : slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5F6368] mb-2">Color</label>
                <div className="flex gap-3">
                  {eventColors.map(color => (
                    <div
                      key={color}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${selectedEvent.color === color ? 'ring-2 ring-offset-2 ring-[#1B3B29]' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent({...selectedEvent, color});
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent();
                  }}
                >
                  Delete
                </button>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 border border-[#DADCE0] rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[#1B3B29] text-white rounded-lg hover:bg-[#145A32] transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateEvent();
                    }}
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
  );
}

export default Calendar;