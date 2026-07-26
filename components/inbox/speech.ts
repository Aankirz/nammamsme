const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

const SCALES: readonly [number, string][] = [
  [10_000_000, "crore"],
  [100_000, "lakh"],
  [1_000, "thousand"],
  [100, "hundred"],
];

function underHundred(value: number): string {
  if (value < 20) return ONES[value];

  const tens = TENS[Math.floor(value / 10)];
  const ones = value % 10;

  return ones === 0 ? tens : `${tens} ${ONES[ones]}`;
}

export function numberInWords(value: number): string {
  const whole = Math.abs(Math.round(value));
  if (whole < 100) return underHundred(whole);

  const parts: string[] = [];
  let left = whole;

  for (const [size, word] of SCALES) {
    const count = Math.floor(left / size);
    if (count > 0) {
      parts.push(`${numberInWords(count)} ${word}`);
      left -= count * size;
    }
  }

  if (left > 0) parts.push(underHundred(left));

  return parts.join(" ");
}

export function rupeesInWords(amount: number): string {
  return `${numberInWords(amount)} rupees`;
}

export function documentsInWords(count: number): string {
  return count === 1 ? "one document" : `${numberInWords(count)} documents`;
}

export function daysInWords(days: number): string {
  const whole = Math.abs(days);
  const noun = whole === 1 ? "day" : "days";

  return days < 0 ? `${numberInWords(whole)} ${noun} late` : `${numberInWords(whole)} ${noun}`;
}
