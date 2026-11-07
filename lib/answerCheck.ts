// Checks a typed numeric answer against the expected short answer.
// Accepts Vietnamese decimal commas, dot or space thousands separators, fractions (4/3),
// and several values separated by ";". Units in either string are ignored.

export type AnswerVerdict = 'correct' | 'wrong' | 'incomplete' | 'invalid';

type Target = { value: number; decimals: number };

const TOKEN = /[-−]?\d+(?:[.,]\d+)*(?:\s*\/\s*\d+(?:[.,]\d+)?)?/;

function joinThousands(s: string) {
  // "25 480" or "25 480" -> "25480"
  return s.replace(/(\d)[\s  ](?=\d{3}(?!\d))/g, '$1');
}

function parseToken(raw: string): Target | null {
  let t = raw.replace(/\s/g, '').replace('−', '-');
  if (t.includes('/')) {
    const [a, b] = t.split('/');
    const x = parseToken(a), y = parseToken(b);
    if (!x || !y || y.value === 0) return null;
    return { value: x.value / y.value, decimals: 3 };
  }
  if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); // 25.480 = 25480
  t = t.replace(',', '.');
  if ((t.match(/\./g) || []).length > 1) return null;
  const value = Number(t);
  if (!Number.isFinite(value)) return null;
  const decimals = t.includes('.') ? t.split('.')[1].length : 0;
  return { value, decimals };
}

function targets(text: string): (Target | null)[] {
  let s = joinThousands(text);
  if (s.includes('≈')) s = s.slice(s.lastIndexOf('≈') + 1);
  return s.split(';').filter(part => /\d/.test(part)).map(part => {
    const m = part.match(TOKEN);
    return m ? parseToken(m[0]) : null;
  });
}

export function checkAnswer(input: string, expected: string): AnswerVerdict {
  const want = targets(expected);
  const got = targets(input);
  if (!got.length || got.some(g => g === null)) return 'invalid';
  if (got.length < want.length) {
    return got.every((g, i) => want[i] && near(g as Target, want[i] as Target)) ? 'incomplete' : 'wrong';
  }
  if (got.length !== want.length) return 'wrong';
  return want.every((w, i) => w && near(got[i] as Target, w)) ? 'correct' : 'wrong';
}

function near(got: Target, want: Target) {
  // Accept rounding to the stated precision, or a 0,5 % relative difference.
  const half = 0.5 * 10 ** -want.decimals;
  const tol = Math.max(half * 1.001, 0.005 * Math.abs(want.value));
  return Math.abs(got.value - want.value) <= tol + 1e-12;
}
