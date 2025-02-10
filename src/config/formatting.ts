// src/config/formatting.ts

export const patterns = {
  boldItalics: /\*\*\*(.*?)\*\*\*/g,
  bold: /\*\*(.*?)\*\*/g,
  italic: /\*(.*?)\*/g,
  italicUnderscore: /_(.*?)_/g,
  underline: /__(.*?)__/g,
  strikethrough: /~~(.*?)~~/g,
  spoiler: /\|\|(.*?)\|\|/g,
  link: /\[([^\]]+)\]\(([^)]+)\)/g,
  video: /\[video:([^:]+):([^\]]+)\]/g,
  youtube: /\[youtube:([^\]]+)\]/g,
  image: /\[img:([^\]]+)\](?:\[size=(\d+)%\])?/g,
  subtext: /^-#\s*(.*)/,
  headertext: /^#\s*(.*)/,
  eventLink: /\[event:([^\]]+)\]/g,
  playerMention: /<([^:]+):([^>]+)>/g,
 };
 
 interface Link {
  text: string;
  url: string;
  index: number;
  length: number;
 }
 
 interface VideoDetails {
  platform: string;
  id: string;
 }
 
 interface ImageDetails {
  url: string;
  size?: string;
 }
 
 interface EventLink {
  id: string;
  index: number;
  length: number;
 }
 
 export const formatText = (text: string): string => {
  return text
    .replace(patterns.boldItalics, '<strong><em>$1</em></strong>')
    .replace(patterns.bold, '<strong>$1</strong>')
    .replace(patterns.italic, '<em>$1</em>')
    .replace(patterns.italicUnderscore, '<em>$1</em>')
    .replace(patterns.underline, '<u>$1</u>')
    .replace(patterns.strikethrough, '<del>$1</del>')
    .replace(patterns.spoiler, '<span class="spoiler">$1</span>');
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
 
 export const extractEventLinks = (text: string): EventLink[] => {
  const eventLinks: EventLink[] = [];
  let match;
  while ((match = patterns.eventLink.exec(text)) !== null) {
    eventLinks.push({
      id: match[1],
      index: match.index,
      length: match[0].length
    });
  }
  return eventLinks;
 };
 
 export const extractVideoDetails = (text: string): VideoDetails | null => {
  const match = text.match(patterns.video);
  if (!match) return null;
 
  const [, platform, id] = text.match(/\[video:([^:]+):([^\]]+)\]/) || [];
  return { platform, id };
 };
 
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
 
 export const isSubtext = (text: string): boolean => patterns.subtext.test(text);
 export const getSubtextContent = (text: string): string => text.match(patterns.subtext)?.[1] || text;
 
 export const isHeadertext = (text: string): boolean => patterns.headertext.test(text);
 export const getHeadertextContent = (text: string): string => text.match(patterns.headertext)?.[1] || text;
 
 export const isImage = (text: string): boolean => patterns.image.test(text);
 export const isVideo = (text: string): boolean => patterns.video.test(text) || patterns.youtube.test(text);
 
 export const getClass = (type: 'subtext' | 'headertext' | 'regular'): string => {
  switch (type) {
    case 'subtext': return 'subtext';
    case 'headertext': return 'headertext';
    default: return 'text';
  }
 };
 
 export const cleanText = (text: string): string => {
  return text.trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
 };
 
 export const shouldGroupLines = (line1: string, line2: string): boolean => {
  return (isImage(line1) || isVideo(line1)) && isSubtext(line2);
 };
 
 export type { 
  Link,
  VideoDetails,
  ImageDetails,
  EventLink
 };