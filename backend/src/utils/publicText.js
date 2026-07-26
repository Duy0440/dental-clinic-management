const MAX_PUBLIC_INPUT_LENGTH = 800;

const normalizeVietnamese = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sanitizePublicInput = (value, maxLength = MAX_PUBLIC_INPUT_LENGTH) =>
  String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const tokenize = (value) =>
  normalizeVietnamese(value)
    .split(" ")
    .filter((token) => token.length >= 2);

const levenshteinDistance = (left, right) => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
};

const isCloseToken = (queryToken, candidateToken) => {
  if (queryToken === candidateToken) return true;
  if (queryToken.length < 3 || candidateToken.length < 3) return false;
  if (queryToken.slice(0, 2) !== candidateToken.slice(0, 2)) return false;

  const allowedDistance = Math.max(queryToken.length, candidateToken.length) >= 8 ? 2 : 1;
  return levenshteinDistance(queryToken, candidateToken) <= allowedDistance;
};

module.exports = {
  MAX_PUBLIC_INPUT_LENGTH,
  isCloseToken,
  normalizeVietnamese,
  sanitizePublicInput,
  tokenize,
};
