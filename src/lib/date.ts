import dayjs from "dayjs";

export const formatDate = (timestamp: number) => {
  const time = dayjs(timestamp * 1000);
  const now = dayjs();

  const diffMonth = now.diff(time, "month");
  if (diffMonth >= 2) {
    return time.format("YYYY年MM月DD日");
  }

  const diffDay = now.diff(time, "day");
  if (diffDay >= 1) {
    return `${diffDay} 天前`;
  }

  const diffHour = now.diff(time, "hour");
  if (diffHour >= 1) {
    return `${diffHour} 小时前`;
  }

  const diffMinute = now.diff(time, "minute");
  if (diffMinute >= 1) {
    return `${diffMinute} 分钟前`;
  }

  return "刚刚";
};
