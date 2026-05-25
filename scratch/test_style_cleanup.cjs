const fs = require('fs');
const path = require('path');

const whitelist = new Set([
  'background', 'background-color', 'color', 
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
  'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'width', 'height', 'max-width', 'min-width', 'max-height', 'min-height',
  'border', 'border-radius', 'border-color', 'border-width', 'border-style', 
  'border-top', 'border-bottom', 'border-left', 'border-right',
  'display', 'flex-direction', 'align-items', 'justify-content', 'flex', 'flex-wrap',
  'box-sizing', 'text-align', 'text-decoration',
  'position', 'top', 'left', 'right', 'bottom',
  'opacity', 'vertical-align', 'list-style', 'line-break', 'white-space',
  'text-transform', 'flex-grow', 'flex-shrink', 'flex-basis', 'border-collapse',
  'box-shadow', 'cursor', 'word-break', 'overflow', 'text-overflow'
]);

const sample = `style="background-color: rgb(250, 245, 232); font-family: &quot;Instrument Serif&quot;, &quot;Times New Roman&quot;, serif; font-size: 16px; --invalid-prop: 10px;"`;

const styleRegex = /style="([^"]*)"/gi;
const result = sample.replace(styleRegex, (match, styleContent) => {
  const normalized = styleContent.replace(/&quot;/g, "'");
  const props = normalized.split(';');
  const cleaned = props.filter(prop => {
    const trimmed = prop.trim();
    if (!trimmed) return false;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return false;
    const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
    return whitelist.has(key);
  });
  return `style="${cleaned.join('; ')}"`;
});

console.log('Original:', sample);
console.log('Cleaned: ', result);
