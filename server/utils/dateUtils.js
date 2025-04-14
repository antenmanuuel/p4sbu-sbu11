/**
 * Date utility functions for standardizing timezone handling
 * All date operations should use Eastern Time (ET) for consistency
 */

/**
 * Converts a date to Eastern Time
 * @param {Date|string} date - Date object or ISO string to convert
 * @returns {Date} Date object in Eastern Time
 */
const toEasternTime = (date) => {
    const inputDate = date instanceof Date ? date : new Date(date);
    // Convert to ET (UTC-5 for EST, UTC-4 for EDT)
    return new Date(inputDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));
};

/**
 * Creates a new Date object in Eastern Time
 * @returns {Date} Current date and time in Eastern Time
 */
const nowInEasternTime = () => {
    return toEasternTime(new Date());
};

/**
 * Checks if a time is after a specific hour in Eastern Time
 * @param {Date|string} date - Date to check
 * @param {number} hour - Hour to check against (24-hour format)
 * @returns {boolean} True if date is after the specified hour
 */
const isAfterHourET = (date, hour) => {
    const etDate = toEasternTime(date);
    return etDate.getHours() >= hour;
};

/**
 * Formats a date as a locale string in Eastern Time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
const formatETDate = (date) => {
    const etDate = toEasternTime(date);
    return etDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};

/**
 * Sets a date to a specific hour in Eastern Time
 * @param {Date|string} date - Date to modify
 * @param {number} hour - Hour to set (24-hour format)
 * @param {number} minute - Minute to set
 * @param {number} second - Second to set
 * @param {number} millisecond - Millisecond to set
 * @returns {Date} Modified date
 */
const setHourET = (date, hour, minute = 0, second = 0, millisecond = 0) => {
    const etDate = toEasternTime(date);
    etDate.setHours(hour, minute, second, millisecond);
    return etDate;
};

/**
 * Gets the start of day in Eastern Time
 * @param {Date|string} date - Date to get start of day
 * @returns {Date} Date set to start of day
 */
const startOfDayET = (date) => {
    return setHourET(date, 0, 0, 0, 0);
};

module.exports = {
    toEasternTime,
    nowInEasternTime,
    isAfterHourET,
    formatETDate,
    setHourET,
    startOfDayET
}; 