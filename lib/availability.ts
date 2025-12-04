import { PairAvailabilitySlotDto } from './api/availability';
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
const JS_DAY_TO_WEEKDAY: Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export type Next7Day = {
  date: Date;
  dayLabel: string;
  weekdayLabel: string;
  weekdayEnum: Weekday;
};

export type PairCell = {
  key: string;
  dayIndex: number;
  timeSlot: TimeSlot;
  selfAvailable: boolean;
  partnerAvailable: boolean;
};

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
export type AvailabilityMark = 'CIRCLE' | 'TRIANGLE' | 'CROSS';

export function availabilityStatusToMark(status: AvailabilityStatus): AvailabilityMark {
  if (status === 'AVAILABLE') return 'CIRCLE';
  if (status === 'MEET_ONLY') return 'TRIANGLE';
  return 'CROSS';
}

export function availabilityMarkToStatus(mark: AvailabilityMark): AvailabilityStatus {
  if (mark === 'CIRCLE') return 'AVAILABLE';
  if (mark === 'TRIANGLE') return 'MEET_ONLY';
  return 'UNAVAILABLE';
}

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
export function mapJsDayToWeekdayEnum(dayIndex: number): Weekday {
  return JS_DAY_TO_WEEKDAY[dayIndex] ?? 'SUN';
}

export function mapWeekdayEnumToJa(weekday: Weekday): string {
  return WEEKDAY_LABEL_MAP[weekday] ?? weekday;
}

export function getNext7Days(): Next7Day[] {
  const today = new Date();
  const result: Next7Day[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dayLabel = String(d.getDate());
    const weekdayEnum = mapJsDayToWeekdayEnum(d.getDay());
    const weekdayLabel = mapWeekdayEnumToJa(weekdayEnum);

    result.push({ date: d, dayLabel, weekdayLabel, weekdayEnum });
  }

  return result;
}

export function buildPairCellsForNext7Days(days: Next7Day[], slots: PairAvailabilitySlotDto[]): PairCell[] {
  const slotMap = new Map<string, PairAvailabilitySlotDto>();
  (slots ?? []).forEach((slot) => {
    const key = `${slot.weekday}-${slot.timeSlot}`;
    if (!slotMap.has(key)) {
      slotMap.set(key, slot);
    }
  });

  const cells: PairCell[] = [];

  days.forEach((day, dayIndex) => {
    TIMESLOTS.forEach(({ value: timeSlot }) => {
      const key = `${day.weekdayEnum}-${timeSlot}`;
      const slot = slotMap.get(key);
      cells.push({
        key,
        dayIndex,
        timeSlot,
        selfAvailable: slot?.selfAvailable ?? false,
        partnerAvailable: slot?.partnerAvailable ?? false
      });
    });
  });

  return cells;
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
