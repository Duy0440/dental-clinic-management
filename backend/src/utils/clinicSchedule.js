const SLOT_MINUTES = 30;
const MORNING_START = 8 * 60;
const MORNING_END = 12 * 60;
const AFTERNOON_START = 13 * 60 + 30;
const ONLINE_BOOKING_END = 18 * 60;

const padTime = (value) => String(value).padStart(2, "0");

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${padTime(hours)}:${padTime(mins)}`;
};

const normalizeTime = (value) => (value ? String(value).slice(0, 5) : null);

const getTodayText = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = padTime(today.getMonth() + 1);
  const day = padTime(today.getDate());
  return `${year}-${month}-${day}`;
};

const parseDateText = (dateText) => {
  if (!dateText) return null;

  const [year, month, day] = String(dateText).slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(Date.UTC(year, month - 1, day));
};

const isPastClinicDate = (dateText) => {
  if (!dateText) return false;
  return String(dateText).slice(0, 10) < getTodayText();
};

const getClinicDayInfo = (dateText) => {
  const parsedDate = parseDateText(dateText);

  if (!parsedDate) {
    return {
      isValid: false,
      isClosed: true,
      dayIndex: null,
      dayLabel: "",
      message: "Ngày khám không hợp lệ.",
    };
  }

  const dayIndex = parsedDate.getUTCDay();
  const labels = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  if (dayIndex === 1) {
    return {
      isValid: true,
      isClosed: true,
      dayIndex,
      dayLabel: labels[dayIndex],
      message: "Thứ 2 phòng khám tạm nghỉ, bạn vui lòng chọn ngày khác.",
    };
  }

  return {
    isValid: true,
    isClosed: false,
    dayIndex,
    dayLabel: labels[dayIndex],
    message:
      "Phòng khám nhận lịch online từ 08:00-12:00 và 13:30-18:00.",
  };
};

const buildRange = (start, end) => {
  const times = [];

  for (let minute = start; minute < end; minute += SLOT_MINUTES) {
    times.push(minutesToTime(minute));
  }

  return times;
};

const getClinicBookingTimeOptions = (dateText) => {
  const dayInfo = getClinicDayInfo(dateText);

  if (!dayInfo.isValid || dayInfo.isClosed || isPastClinicDate(dateText)) {
    return [];
  }

  return [
    ...buildRange(MORNING_START, MORNING_END),
    ...buildRange(AFTERNOON_START, ONLINE_BOOKING_END),
  ];
};

const isClinicBookingTime = (dateText, timeValue) => {
  const normalizedTime = normalizeTime(timeValue);
  return getClinicBookingTimeOptions(dateText).includes(normalizedTime);
};

module.exports = {
  getClinicDayInfo,
  getClinicBookingTimeOptions,
  getTodayText,
  isClinicBookingTime,
  isPastClinicDate,
  normalizeTime,
};
