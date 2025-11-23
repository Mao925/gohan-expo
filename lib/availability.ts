import { AvailabilityGrid, AvailabilitySlotDto, AvailabilityStatus, TimeSlot, Weekday } from './types';

export const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: 'MON', label: '月' },
  { value: 'TUE', label: '火' },
  { value: 'WED', label: '水' },
  { value: 'THU', label: '木' },
  { value: 'FRI', label: '金' },
  { value: 'SAT', label: '土' },
  { value: 'SUN', label: '日' }
];

export const TIMESLOTS: { value: TimeSlot; label: string }[] = [
  { value: 'DAY', label: '昼' },
  { value: 'NIGHT', label: '夜' }
];

const WEEKDAY_LABEL_MAP: Record<Weekday, string> = WEEKDAYS.reduce(
  (map, { value, label }) => ({ ...map, [value]: label }),
  {} as Record<Weekday, string>
);

const TIMESLOT_LABEL_MAP: Record<TimeSlot, string> = TIMESLOTS.reduce(
  (map, { value, label }) => ({ ...map, [value]: label }),
  {} as Record<TimeSlot, string>
);

const DEFAULT_STATUS: AvailabilityStatus = 'UNAVAILABLE';
const VALID_STATUSES: AvailabilityStatus[] = ['AVAILABLE', 'UNAVAILABLE'];

export function createDefaultGrid(): AvailabilityGrid {
  return WEEKDAYS.reduce((grid, { value: weekday }) => {
    grid[weekday] = TIMESLOTS.reduce((row, { value: timeSlot }) => {
      row[timeSlot] = DEFAULT_STATUS;
      return row;
    }, {} as Record<TimeSlot, AvailabilityStatus>);
    return grid;
  }, {} as AvailabilityGrid);
}

// Convert API response into a 2D grid while filling missing slots as UNAVAILABLE.
export function slotsToGrid(slots: AvailabilitySlotDto[] | null | undefined): AvailabilityGrid {
  const grid = createDefaultGrid();
  if (!slots) return grid;
  for (const slot of slots) {
    if (!grid[slot.weekday]) continue;
    grid[slot.weekday][slot.timeSlot] = slot.status;
  }
  return grid;
}

// Flatten the grid back into the DTO format expected by the API.
export function gridToSlots(grid: AvailabilityGrid): AvailabilitySlotDto[] {
  return WEEKDAYS.flatMap(({ value: weekday }) =>
    TIMESLOTS.map(({ value: timeSlot }) => ({
      weekday,
      timeSlot,
      status: grid?.[weekday]?.[timeSlot] ?? DEFAULT_STATUS
    }))
  );
}

// Prepare payload for API: only send AVAILABLE slots, treat others as implicit UNAVAILABLE.
export function gridToPayload(grid: AvailabilityGrid): AvailabilitySlotDto[] {
  const seen = new Set<string>();
  const payload: AvailabilitySlotDto[] = [];
  for (const { value: weekday } of WEEKDAYS) {
    for (const { value: timeSlot } of TIMESLOTS) {
      const status = grid?.[weekday]?.[timeSlot];
      if (!VALID_STATUSES.includes(status as AvailabilityStatus)) continue;
      if (status !== 'AVAILABLE') continue;
      const key = `${weekday}-${timeSlot}`;
      if (seen.has(key)) continue;
      payload.push({ weekday, timeSlot, status: status as AvailabilityStatus });
      seen.add(key);
    }
  }
  return payload;
}

export function getWeekdayLabel(weekday: Weekday): string {
  return WEEKDAY_LABEL_MAP[weekday] ?? weekday;
}

export function getTimeSlotLabel(timeSlot: TimeSlot): string {
  return TIMESLOT_LABEL_MAP[timeSlot] ?? timeSlot;
}

export function formatAvailabilitySlot(weekday: Weekday, timeSlot: TimeSlot): string {
  return `${getWeekdayLabel(weekday)} ${getTimeSlotLabel(timeSlot)}`;
}
