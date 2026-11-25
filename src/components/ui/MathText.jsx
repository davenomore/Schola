import React, { useMemo } from 'react';

/**
 * MathText komponens
 * LaTeX és ASCII matematikai kifejezések ($...$ vagy $$...$$, vagy n! / (k! * (n-k)!), n^k, n!)
 * intelligens felismerése és renderelése KaTeX segítségével,
 * beépített CSS/HTML fallbackkel, ha a KaTeX még nem töltődött be.
 */
export default function MathText({ text, className = '', style = {}, block = false }) {
  if (text === null || text === undefined) return null;
  const str = String(text);

  // Szétbontjuk a szöveget matematikai ($...$ vagy felismert formulák) és normál szövegrészekre
  const parts = useMemo(() => {
    return parseTextToMathTokens(str, block);
  }, [str, block]);

  // Ha csak egyetlen sima szöveges elem van, ami nem matek
  if (parts.length === 1 && parts[0].type === 'text') {
    return <span className={className} style={style}>{parts[0].value}</span>;
  }

  return (
    <span className={`math-text-container ${className}`} style={{ display: block ? 'block' : 'inline', ...style }}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <span key={idx}>{part.value}</span>;
        }
        return <MathRenderer key={idx} math={part.value} display={part.display || block} />;
      })}
    </span>
  );
}

/**
 * Szöveg felbontása matematikai és normál részekre
 */
function parseTextToMathTokens(rawStr, block = false) {
  // 1. Ha az egész szöveg önmagában egy matematikai kifejezés (pl: "n! / (k! * (n-k)!)", "n^k", "n!")
  if (isEntirelyMath(rawStr)) {
    return [{ type: 'math', value: convertAsciiMathToLatex(rawStr), display: block }];
  }

  // 2. Beágyazott matematikai alakok automatikus dollárjelbe ($...$) burkolása
  const str = autoWrapEmbeddedMath(rawStr);

  const tokens = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^\$]+?)\$/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: str.slice(lastIndex, match.index) });
    }
    const mathContent = match[1] || match[2];
    const isDisplay = Boolean(match[1]);
    tokens.push({ type: 'math', value: convertAsciiMathToLatex(mathContent.trim()), display: isDisplay });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    tokens.push({ type: 'text', value: str.slice(lastIndex) });
  }

  // 3. Ha nincsenek $ jelek, de van benne LaTeX parancs vagy indexelés
  if (tokens.length === 1 && tokens[0].type === 'text') {
    if (/\\(frac|binom|cdot|times|sqrt|alpha|beta|Delta|pi|sum|int|pm|le|ge|neq)|\^|\_/.test(str)) {
      return [{ type: 'math', value: convertAsciiMathToLatex(str.trim()), display: block }];
    }
  }

  return tokens;
}

/**
 * Kiszűri, hogy a teljes sztring tisztán matematikai képlet-e
 */
function isEntirelyMath(str) {
  if (!str) return false;
  const s = str.trim();
  if (!s) return false;

  // Ha tipikus magyar mondatszavak vannak benne, nem tiszta képlet
  const proseRegex = /\b(hogy|mert|vagy|és|nem|csak|minden|melyik|hogyan|értéke|kapcsolat|szerint|számít|számítás|lehetséges|állítás|valós|példa|összes|egyik|másik|különbség|törvény|mértékegység|test|sebesség|tömeg)\b/i;
  if (proseRegex.test(s)) return false;

  // Faktoriálisok és hatványok: pl. n!, k!, (n-k)!, n^k, x^2, x_1
  if (/^[a-zA-Z0-9\(\)\-]+!$/.test(s)) return true;
  if (/^[a-zA-Z0-9\(\)\-]+[\^_²³⁴][a-zA-Z0-9\(\)\-]+$/.test(s)) return true;

  // Törtek perjelekkel: n! / (k! * (n-k)!), n! / (n-k)!, a / b, 1/2
  if (/[a-zA-Z0-9\)!]\s*\/\s*[a-zA-Z0-9\(!]/.test(s)) return true;

  // Matematikai szimbólumok és formulakarakterek
  const formulaCharsOnly = /^(?:[a-zA-Z0-9\(\)\{\}\[\]\!\/\*\+\-\=\^\_\.\,\s\\·±²³⁴]|\\binom|\\frac|\\cdot|\\sqrt)+$/.test(s);
  const hasMathFeature = /[\!\/\*\^\_\=\\±²³⁴]|\bbinom\b|\bfrac\b|\balatt\b/.test(s);

  return formulaCharsOnly && hasMathFeature;
}

/**
 * Zárójelek leválasztása, ha a teljes kifejezést átölelik
 */
function stripOuterParens(s) {
  let str = s.trim();
  if (!str.startsWith('(') || !str.endsWith(')')) return str;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    if (depth === 0 && i < str.length - 1) return str;
  }
  return depth === 0 ? str.slice(1, -1).trim() : str;
}

/**
 * ASCII matematikai kifejezések átalakítása szabványos LaTeX formátummá
 */
export function convertAsciiMathToLatex(expr) {
  if (!expr) return '';
  let s = expr.trim();

  // 1. Exponensek: ² -> ^2, ³ -> ^3
  s = s.replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4');

  // 2. Kombinációs szóbeli leírás: (n alatt k), (90 alatt az 5), (5 alatt a 2)
  s = s.replace(/\(?\b([a-zA-Z0-9]+)\s+alatt\s+(?:a\s+|az\s+)?([a-zA-Z0-9\-]+)\)?/gi, '\\binom{$1}{$2}');

  // 3. Plusz-mínusz: +- vagy +/- -> \pm
  s = s.replace(/\+\s*\/\s*\-|\+\-/g, '\\pm ');

  // 4. Gyökvonás: sqrt(x) vagy √(x)
  s = s.replace(/(?:sqrt|√)\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√([a-zA-Z0-9]+)/g, '\\sqrt{$1}');

  // 5. Relációk: <=, >=, !=, ~=
  s = s.replace(/<=/g, '\\le ').replace(/>=/g, '\\ge ').replace(/!=/g, '\\neq ').replace(/~=/g, '\\approx ');

  // 6. Szorzás: * vagy · -> \cdot
  s = s.replace(/\s*[\*·]\s*/g, ' \\cdot ');

  // 7. Törtek átalakítása: Numerator / Denominator
  function convertFractions(str) {
    let depth = 0;
    let slashes = [];
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(' || str[i] === '{') depth++;
      else if (str[i] === ')' || str[i] === '}') depth--;
      else if (str[i] === '/' && depth === 0) {
        slashes.push(i);
      }
    }
    if (slashes.length === 1) {
      let num = stripOuterParens(str.slice(0, slashes[0]));
      let den = stripOuterParens(str.slice(slashes[0] + 1));
      num = convertFractions(num);
      den = convertFractions(den);
      return `\\frac{${num}}{${den}}`;
    }
    return str;
  }

  if (s.includes('=')) {
    return s.split('=').map(p => convertFractions(p.trim())).join(' = ');
  }

  return convertFractions(s);
}

/**
 * Szövegben található matematikai utalások automatikus dollárjelbe burkolása
 */
function autoWrapEmbeddedMath(text) {
  if (!text) return '';
  let s = text;

  // Ha már van dollárjel, nem avatkozunk bele globálisan
  if (s.includes('$')) return s;

  // Kombinációs kifejezés pl: (90 alatt az 5)
  s = s.replace(/\(?\b([a-zA-Z0-9]+)\s+alatt\s+(?:a\s+|az\s+)?([a-zA-Z0-9\-]+)\)?/gi, '$\\binom{$1}{$2}$');

  // Magyarázó zárójelekben lévő számítások pl: (mert 5 * 4 / 2 = 10) vagy (mert 5! = 120)
  s = s.replace(/\(mert\s+([^)]+)\)/gi, (m, expr) => {
    return '(mert $' + convertAsciiMathToLatex(expr) + '$)';
  });

  return s;
}

function MathRenderer({ math, display }) {
  const renderedHtml = useMemo(() => {
    // 1. Ha a globális KaTeX elérhető a böngészőben:
    if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
      try {
        return window.katex.renderToString(math, {
          displayMode: display,
          throwOnError: false,
          output: 'html'
        });
      } catch (e) {
        console.warn('KaTeX render error:', e);
      }
    }

    // 2. Intelligens fallback renderer
    return fallbackRenderMath(math);
  }, [math, display]);

  return (
    <span
      className="math-rendered"
      style={{
        display: display ? 'block' : 'inline-block',
        margin: display ? '6px 0' : '0 2px',
        verticalAlign: 'middle',
        lineHeight: 1
      }}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

/**
 * Szép HTML-alapú matematikai fallback megjelenítő, ha KaTeX épp nincs betöltve
 */
function fallbackRenderMath(math) {
  let res = math;

  // \binom{n}{k} -> kombinációs szimbólum
  res = res.replace(/\\binom\{([^}]+)\}\{([^}]+)\}/g, (_, top, bottom) => {
    return `<span style="display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;padding:0 2px;line-height:1;font-size:0.9em;">
      <span>(</span>
      <span style="display:inline-flex;flex-direction:column;">
        <span style="border-bottom:none;padding-bottom:1px;">${top}</span>
        <span>${bottom}</span>
      </span>
      <span>)</span>
    </span>`;
  });

  // \frac{a}{b} -> törtek formázása
  res = res.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_, num, den) => {
    return `<span style="display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;padding:0 3px;font-size:0.95em;line-height:1.1;">
      <span style="border-bottom:1.5px solid currentColor;padding-bottom:2px;display:block;">${num}</span>
      <span style="padding-top:2px;display:block;">${den}</span>
    </span>`;
  });

  // \sqrt{x}
  res = res.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // Hatványok: x^{n} vagy x^n
  res = res.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  res = res.replace(/\^([0-9a-zA-Z+-]+)/g, '<sup>$1</sup>');

  // Alsó indexek: x_{n} vagy x_1
  res = res.replace(/\_\{([^}]+)\}/g, '<sub>$1</sub>');
  res = res.replace(/\_([0-9a-zA-Z+-]+)/g, '<sub>$1</sub>');

  // Szimbólumok és görög betűk
  const replacements = [
    [/\\cdot/g, '·'],
    [/\\times/g, '×'],
    [/\\pm/g, '±'],
    [/\\mp/g, '∓'],
    [/\\neq/g, '≠'],
    [/\\le(q)?/g, '≤'],
    [/\\ge(q)?/g, '≥'],
    [/\\approx/g, '≈'],
    [/\\infty/g, '∞'],
    [/\\in/g, '∈'],
    [/\\notin/g, '∉'],
    [/\\subset/g, '⊂'],
    [/\\cup/g, '∪'],
    [/\\cap/g, '∩'],
    [/\\emptyset/g, '∅'],
    [/\\Delta/g, 'Δ'],
    [/\\alpha/g, 'α'],
    [/\\beta/g, 'β'],
    [/\\gamma/g, 'γ'],
    [/\\pi/g, 'π'],
    [/\\theta/g, 'θ'],
    [/\\lambda/g, 'λ'],
    [/\\mu/g, 'μ'],
    [/\\sigma/g, 'σ'],
    [/\\omega/g, 'ω'],
    [/\\rightarrow/g, '→'],
    [/\\Leftarrow/g, '⇐'],
    [/\\Rightarrow/g, '⇒'],
    [/\\Leftrightarrow/g, '⇔']
  ];

  for (const [pattern, rep] of replacements) {
    res = res.replace(pattern, rep);
  }

  // Maradék felesleges kapcsos zárójelek tisztítása
  res = res.replace(/[\{\}]/g, '');

  return `<span style="font-family:'Cambria Math','Times New Roman',serif;font-style:italic;letter-spacing:0.5px;">${res}</span>`;
}
