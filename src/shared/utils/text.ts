export type CleanOptions = {
  lowercase?: boolean;
  removeAccents?: boolean;
  separator?: string | null; // null = keep spaces, otherwise replace spaces with this
  collapseSpaces?: boolean;
  allowedPattern?: RegExp | null; // optional pattern of allowed characters
};

export function cleanText(input: string, options?: CleanOptions): string {
  if (typeof input !== 'string') return '';
  const opts: Required<CleanOptions> = {
    lowercase: true,
    removeAccents: true,
    separator: null,
    collapseSpaces: true,
    allowedPattern: null,
    ...options,
  } as Required<CleanOptions>;

  let s = input.trim();

  if (opts.removeAccents) {
    s = s.normalize('NFD').replace(/\p{M}/gu, '');
  }

  if (opts.allowedPattern) {
    const patt = opts.allowedPattern;
    s = s
      .split('')
      .map((ch) => (patt.test(ch) ? ch : ' '))
      .join('');
  } else {
    s = s.replace(/[^A-Za-z0-9\s\-_.]/g, ' ');
  }

  if (opts.collapseSpaces) s = s.replace(/\s+/g, ' ');
  s = s.trim();

  if (opts.lowercase) s = s.toLowerCase();

  if (opts.separator !== null) {
    s = s.replace(/\s+/g, opts.separator);
  }

  return s;
}

export function slugify(input: string, options?: Omit<CleanOptions, 'separator'>) {
  return cleanText(input, { ...options, separator: '-' });
}

export default cleanText;
