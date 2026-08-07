const LEFT_PATTERNS = [
  [3, 2, 1, 1],
  [2, 2, 2, 1],
  [2, 1, 2, 2],
  [1, 4, 1, 1],
  [1, 1, 3, 2],
  [1, 2, 3, 1],
  [1, 1, 1, 4],
  [1, 3, 1, 2],
  [1, 2, 1, 3],
  [3, 1, 1, 2],
] as const;

const G_PATTERNS = [
  [1, 1, 2, 3],
  [1, 2, 2, 2],
  [2, 2, 1, 2],
  [1, 1, 4, 1],
  [2, 3, 1, 1],
  [1, 3, 2, 1],
  [4, 1, 1, 1],
  [2, 1, 3, 1],
  [3, 1, 2, 1],
  [2, 1, 1, 3],
] as const;

const FIRST_DIGIT_PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
] as const;

type Run = { color: 0 | 1; width: number };
type DigitMatch = { digit: number; score: number };

function patternScore(widths: number[], pattern: readonly number[]) {
  const total = widths.reduce((sum, width) => sum + width, 0);
  if (total <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return widths.reduce(
    (score, width, index) => score + Math.abs((width * 7) / total - pattern[index]),
    0,
  );
}

function matchDigit(
  widths: number[],
  patterns: readonly (readonly number[])[],
): DigitMatch | null {
  let best: DigitMatch | null = null;

  for (let digit = 0; digit < patterns.length; digit += 1) {
    const score = patternScore(widths, patterns[digit]);
    if (!best || score < best.score) {
      best = { digit, score };
    }
  }

  return best && best.score <= 1.75 ? best : null;
}

function guardLooksValid(widths: number[]) {
  const average = widths.reduce((sum, width) => sum + width, 0) / widths.length;
  return average > 0 && widths.every((width) => Math.abs(width / average - 1) <= 0.7);
}

export function isValidEan13(value: string) {
  if (!/^\d{13}$/.test(value)) {
    return false;
  }

  const digits = [...value].map(Number);
  const sum = digits
    .slice(0, 12)
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
}

export function decodeEan13Runs(widths: number[]) {
  if (widths.length !== 59) {
    return null;
  }

  if (
    !guardLooksValid(widths.slice(0, 3)) ||
    !guardLooksValid(widths.slice(27, 32)) ||
    !guardLooksValid(widths.slice(56, 59))
  ) {
    return null;
  }

  const leftDigits: number[] = [];
  let parity = "";

  for (let index = 0; index < 6; index += 1) {
    const digitWidths = widths.slice(3 + index * 4, 7 + index * 4);
    const left = matchDigit(digitWidths, LEFT_PATTERNS);
    const alternate = matchDigit(digitWidths, G_PATTERNS);

    if (!left && !alternate) {
      return null;
    }

    const useLeft = left && (!alternate || left.score <= alternate.score);
    leftDigits.push(useLeft ? left.digit : alternate!.digit);
    parity += useLeft ? "L" : "G";
  }

  const firstDigit = FIRST_DIGIT_PARITY.indexOf(
    parity as (typeof FIRST_DIGIT_PARITY)[number],
  );
  if (firstDigit < 0) {
    return null;
  }

  const rightDigits: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    const digit = matchDigit(
      widths.slice(32 + index * 4, 36 + index * 4),
      LEFT_PATTERNS,
    );
    if (!digit) {
      return null;
    }
    rightDigits.push(digit.digit);
  }

  const value = `${firstDigit}${leftDigits.join("")}${rightDigits.join("")}`;
  return isValidEan13(value) ? value : null;
}

function toRuns(binary: ArrayLike<number>): Run[] {
  if (!binary.length) {
    return [];
  }

  const runs: Run[] = [];
  let color: 0 | 1 = binary[0] ? 1 : 0;
  let width = 1;

  for (let index = 1; index < binary.length; index += 1) {
    const nextColor: 0 | 1 = binary[index] ? 1 : 0;
    if (nextColor === color) {
      width += 1;
    } else {
      runs.push({ color, width });
      color = nextColor;
      width = 1;
    }
  }
  runs.push({ color, width });
  return runs;
}

function decodeDirection(binary: ArrayLike<number>) {
  const runs = toRuns(binary);

  for (let index = 0; index + 59 <= runs.length; index += 1) {
    if (runs[index].color !== 1) {
      continue;
    }

    const value = decodeEan13Runs(
      runs.slice(index, index + 59).map((run) => run.width),
    );
    if (value) {
      return value;
    }
  }

  return null;
}

export function decodeEan13FromBinary(binary: ArrayLike<number>) {
  const forward = decodeDirection(binary);
  if (forward) {
    return forward;
  }

  return decodeDirection(Array.from(binary).reverse());
}

function otsuThreshold(grayscale: ArrayLike<number>) {
  const histogram = new Array<number>(256).fill(0);
  let sum = 0;

  for (let index = 0; index < grayscale.length; index += 1) {
    const value = grayscale[index];
    histogram[value] += 1;
    sum += value;
  }

  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = -1;
  let threshold = 127;

  for (let value = 0; value < 256; value += 1) {
    backgroundWeight += histogram[value];
    if (!backgroundWeight) {
      continue;
    }

    const foregroundWeight = grayscale.length - backgroundWeight;
    if (!foregroundWeight) {
      break;
    }

    backgroundSum += value * histogram[value];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance =
      backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;

    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = value;
    }
  }

  return threshold;
}

export function decodeEan13FromGrayscale(grayscale: ArrayLike<number>) {
  if (grayscale.length < 95) {
    return null;
  }

  let minimum = 255;
  let maximum = 0;
  let total = 0;
  for (let index = 0; index < grayscale.length; index += 1) {
    minimum = Math.min(minimum, grayscale[index]);
    maximum = Math.max(maximum, grayscale[index]);
    total += grayscale[index];
  }

  if (maximum - minimum < 45) {
    return null;
  }

  const thresholds = new Set([
    otsuThreshold(grayscale),
    Math.round((minimum + maximum) / 2),
    Math.round(total / grayscale.length),
  ]);

  for (const threshold of thresholds) {
    const binary = Array.from(grayscale, (value) => (value <= threshold ? 1 : 0));
    const value = decodeEan13FromBinary(binary);
    if (value) {
      return value;
    }
  }

  return null;
}

