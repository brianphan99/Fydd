import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SanitizedHTMLProps {
  html: string;
  className?: string;
}

const SanitizedHTML: React.FC<SanitizedHTMLProps> = ({ html, className }) => {
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'img', 'blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'src', 'alt'],
    });
  }, [html]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
    />
  );
};

export default SanitizedHTML;
