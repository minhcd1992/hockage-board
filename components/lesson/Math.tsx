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
  });

  const Component = 'span';

  return <Component dangerouslySetInnerHTML={{ __html: html }} className={inline ? 'mx-1 inline-block' : 'my-4 flex justify-center'} />;
};
