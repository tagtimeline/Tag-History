// src/config/formatting.ts

export const patterns = {
  boldItalics: /\*\*\*(.*?)\*\*\*/g,                // Format: ***text***
  bold: /\*\*(.*?)\*\*/g,                           // Format: **text**
  italic: /\*(.*?)\*/g,                             // Format: *text*
  italicUnderscore: /_(.*?)_/g,                     // Format: _text_
  underline: /__(.*?)__/g,                          // Format: __text__
  strikethrough: /~~(.*?)~~/g,                      // Format: ~~text~~  
  spoiler: /\|\|(.*?)\|\|/g,                        // Format: ||text||
  link: /\[([^\]]+)\]\(([^)]+)\)/g,                 // Format: [text](url)
  youtube: /\[youtube:([^\]]+)\]/g,                 // Format: [youtube:videoId]
  image: /\[img:([^\]]+)\](?:\[size=(\d+)%\])?/g,   // Format: [img:url][size=50%]
  subtext: /^-#\s*(.*)/,                            // Format: -# text
  headertext: /^#\s*(.*)/,                          // Format: # text
};

interface Link {
  text: string;
  url: string;
  index: number;
  length: number;
}

export const formatText = (text: string): string => {
  const formattedText = text
    .replace(patterns.bold, '<strong>$1</strong>')
    .replace(patterns.italic, '<em>$1</em>')
    .replace(patterns.underline, '<u>$1</u>')
    .replace(patterns.strikethrough, '<del>$1</del>')
    .replace(patterns.spoiler, '<span class="spoiler">$1</span>');

  return formattedText;
};

export const extractLinks = (text: string): Link[] => {
  const links: Link[] = [];
  let match;

  while ((match = patterns.link.exec(text)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      index: match.index,
      length: match[0].length
    });
  }

  return links;
};

export const isSubtext = (text: string): boolean => {
  return patterns.subtext.test(text);
};

export const getSubtextContent = (text: string): string => {
  const match = text.match(patterns.subtext);
  return match ? match[1] : text;
};

export const isHeadertext = (text: string): boolean => {
  return patterns.headertext.test(text);
};

export const getHeadertextContent = (text: string): string => {
  const match = text.match(patterns.headertext);
  return match ? match[1] : text;
};

export const getClass = (type: 'subtext' | 'headertext' | 'regular'): string => {
  switch (type) {
    case 'subtext':
      return 'subtext';
    case 'headertext':
      return 'headertext';
    default:
      return 'text';
  }
};

// Extract image details from an image tag
export interface ImageDetails {
  url: string;
  size?: string;
}

export const extractImageDetails = (text: string): ImageDetails | null => {
  const match = text.match(patterns.image);
  if (!match) return null;

  const sizeMatch = text.match(/\[size=(\d+)%\]/);
  const size = sizeMatch ? sizeMatch[1] : null;
  const url = text.slice(
    text.indexOf(':') + 1,
    sizeMatch ? text.indexOf('][') : text.length - 1
  );

  return {
    url,
    size: size ? `${size}%` : undefined
  };
};


// Helper function to check if a line is an image
export const isImage = (text: string): boolean => {
  return patterns.image.test(text);
};

// Helper function to check if a line is a YouTube embed
export const isYouTube = (text: string): boolean => {
  return patterns.youtube.test(text);
};

// Extract YouTube video ID from a YouTube tag
export const extractYouTubeId = (text: string): string | null => {
  const match = text.match(patterns.youtube);
  if (!match) return null;
  return text.slice(text.indexOf(':') + 1, text.length - 1);
};

// Helper function to clean up text content
export const cleanText = (text: string): string => {
  return text.trim()
    .replace(/\r\n/g, '\n')       // Normalize line endings
    .replace(/\n{3,}/g, '\n\n');  // Remove excessive blank lines
};

// Helper function to check if two lines should be grouped together
// (e.g., an image and its subtext)
export const shouldGroupLines = (line1: string, line2: string): boolean => {
  return isImage(line1) && isSubtext(line2);
};