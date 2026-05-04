// scratch/test_logic.js

const BOOKING_ACTION_PATTERNS = [
  // Booking creation
  /\b(book|reserve|make a booking|create a booking|confirm booking)\b/,
  /\b(i want to (book|reserve|stay))\b/,
  /\b(book (me|a|this|that|the)?)\s*(room|hotel|suite|stay)/,

  // Booking cancellation (action — user wants to actually cancel)
  /\b(cancel|stop|terminate)\b.*\b(booking|reservation|stay|journey|trip)\b/,
  /\bcancell?(ing)?\b/,

  // Booking retrieval
  /\b(show|view|get|list|see|fetch|retrieve|display|find|where is|what is)\b.*\b(booking|reservation|stay|journey|trip|history|status)(s)?\b/,
  /\bmy\b.*\b(booking|reservation|stay|journey|trip|history|status)(s)?\b/,
  /\b(booking|reservation|stay|journey|trip) (history|details|status|info|summary)\b/,

  // Check-in / check-out dates context
  /\bcheck[- ]?in\s+(date|on|is|:)/,
  /\bcheck[- ]?out\s+(date|on|is|:)/,
];

const matchesAny = (patterns, text) =>
  patterns.some((pattern) => pattern.test(text.toLowerCase()));

const testCases = [
  "get my upcoming journey",
  "i want my todays booking",
  "show my stays",
  "where is my reservation",
  "booking history",
  "get my trip",
  "get my todays boooking" // Still failed because of 3 'o's, but "journey" etc should work
];

console.log("--- Intent Testing ---");
testCases.forEach(tc => {
  const isAction = matchesAny(BOOKING_ACTION_PATTERNS, tc);
  console.log(`[${isAction ? 'ACTION' : 'INFO'}] "${tc}"`);
});

console.log("\n--- Date Testing ---");
const todayStr = new Date().toISOString().split("T")[0];
console.log(`Today: ${todayStr}`);

const testBookings = [
  { checkIn: "2026-04-27T00:00:00.000Z", checkOut: "2026-04-28T00:00:00.000Z", label: "Check-in Today" },
  { checkIn: "2026-04-26T00:00:00.000Z", checkOut: "2026-04-28T00:00:00.000Z", label: "Staying Today" },
  { checkIn: "2026-04-28T00:00:00.000Z", checkOut: "2026-04-29T00:00:00.000Z", label: "Future" },
  { checkIn: "2026-04-25T00:00:00.000Z", checkOut: "2026-04-26T00:00:00.000Z", label: "Past" }
];

testBookings.forEach(b => {
  const checkInStr = new Date(b.checkIn).toISOString().split("T")[0];
  const checkOutStr = new Date(b.checkOut).toISOString().split("T")[0];
  
  let cat = "";
  if (checkOutStr < todayStr) cat = "PAST";
  else if (checkInStr <= todayStr && checkOutStr >= todayStr) cat = "CURRENT";
  else cat = "UPCOMING";
  
  console.log(`[${cat}] ${b.label}: ${checkInStr} to ${checkOutStr}`);
});
