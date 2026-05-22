export const GENERATION_PROMPT = (style: string, instructions: string) => {
  return [
    `Regenerate this floor plan into a professional ${style} style.`,
    'Strictly preserve the EXACT geometry of the first image (floor plan):',
    '- room positions, wall layout, doors, windows, labels, annotations must remain identical',
    'The second image (if provided) is a VISUAL STYLE REFERENCE ONLY:',
    '- adopt its colors, line quality, typography, drafting aesthetics',
    '- NEVER copy its layout or geometry',
    'Output a clean, high-contrast CAD schematic with precise architectural styling.',
    instructions ? `\n\nAdditional instructions: ${instructions}` : '',
  ].join('\n');
};
