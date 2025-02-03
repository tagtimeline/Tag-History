// src/config/formatting.ts

// Regular expression patterns for text formatting
const patterns = {
  boldItalics: /\*\*\*(.*?)\*\*\*/g,    // Format: ***text***
  bold: /\*\*(.*?)\*\*/g,               // Format: **text**
  italics: /\*(.*?)\*/g,                // Format: *text*
  italicsUnderscore: /_(.*?)_/g,        // Format: _text_
  underline: /__(.*?)__/g,              // Format: __text__
  strikethrough: /~~(.*?)~~/g,          // Format: ~~text~~
  headertext: /^# (.+)$/,               // Format: # text
  subtext: /^-# (.+)$/,                 // Format: -# text
  link: /\[([^\]]+)\]\(([^)]+)\)/g,     // Format: [text](url)
  playerMention: /<([^>]+)>/g,          // Format: <ign>
  youtube: /\[youtube:([^\]]+)\]/g,     // Format: [youtube:videoId]
  image: /\[img:([^\]]+)\]/g,           // Format: [img:url]
} as const;

// CSS classes for formatting
const classes = {
  bold: 'bold',
  italic: 'italic',
  boldItalic: 'bold-italic',
  underline: 'underline',
  strikethrough: 'strikethrough',
  headertext: 'headertext',
  subtext: 'subtext',
  link: 'inline-link',
  playerLink: 'playerLink',
} as const;

// Format text with HTML spans
export const formatText = (text: string): string => {
    return text
      .replace(patterns.boldItalics, `<span class="${classes.boldItalic}">$1</span>`)
      .replace(patterns.bold, `<span class="${classes.bold}">$1</span>`)
      .replace(patterns.italics, `<span class="${classes.italic}">$1</span>`)
      .replace(patterns.italicsUnderscore, `<span class="${classes.italic}">$1</span>`)
      .replace(patterns.underline, `<span class="${classes.underline}">$1</span>`)
      .replace(patterns.strikethrough, `<span class="${classes.strikethrough}">$1</span>`)
      .replace(patterns.playerMention, (match, username) => 
        `<a href="/player/${username}" class="${classes.playerLink}">${match}</a>`
      );
  };

// Check if a line is subtext
export const isSubtext = (text: string): boolean => {
  return patterns.subtext.test(text);
};

// Check if a line is headertext
export const isHeadertext = (text: string): boolean => {
  return patterns.headertext.test(text);
};

// Extract subtext content
export const getSubtextContent = (text: string): string => {
  const match = text.match(patterns.subtext);
  return match ? match[1] : '';
};

// Extract headertext content
export const getHeadertextContent = (text: string): string => {
  const match = text.match(patterns.headertext);
  return match ? match[1] : '';
};

// Type for link match result
interface LinkMatch {
  text: string;
  url: string;
  index: number;
  length: number;
}

// Extract all links from text
export const extractLinks = (text: string): LinkMatch[] => {
  const matches: LinkMatch[] = [];
  let match;
  
  while ((match = patterns.link.exec(text)) !== null) {
    matches.push({
      text: match[1],
      url: match[2],
      index: match.index,
      length: match[0].length
    });
  }
  
  return matches;
};

// CSS class mapping
export const getClass = (type: keyof typeof classes): string => classes[type];

// Patterns export for direct usage
export { patterns };