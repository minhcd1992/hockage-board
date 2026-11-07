import React from 'react';
import katex from 'katex';

interface MathProps {
  children: string;
  inline?: boolean;
}

export const Math: React.FC<MathProps> = ({ children, inline = false }) => {
  const html = katex.renderToString(children, {
    throwOnError: false,
    displayMode: !inline,
    // Vietnamese letters inside \text{...} render with the browser's fallback font;
    // KaTeX only lacks metrics for them. Keep every other strict-mode warning.
    strict: (code: string) => (code === 'unknownSymbol' || code === 'symbolNotInFont' ? 'ignore' : 'warn'),
  });

  const Component = 'span';

  return <Component dangerouslySetInnerHTML={{ __html: html }} className={inline ? 'mx-1 inline-block' : 'my-4 flex justify-center'} />;
};
