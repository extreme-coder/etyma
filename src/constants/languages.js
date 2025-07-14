export const LANGUAGE_COLORS = {
  'Old English': '#8B4513',
  'Latin': '#DC143C',
  'French': '#4169E1',
  'Old Norse': '#228B22',
  'Germanic': '#FF8C00',
  'Greek': '#9932CC',
  'Celtic': '#2E8B57',
  'Sanskrit': '#B8860B',
  'Dutch': '#FF4500',
  'Italian': '#8B008B',
  'Spanish': '#FF69B4',
  'Arabic': '#556B2F',
  'Unknown': '#808080'
}

export const ETYMOLOGY_PATTERNS = [
  { pattern: /from\s+(?:the\s+)?old\s+english/i, origin: 'Old English' },
  { pattern: /from\s+(?:the\s+)?latin/i, origin: 'Latin' },
  { pattern: /from\s+(?:the\s+)?(?:old\s+)?french/i, origin: 'French' },
  { pattern: /from\s+(?:the\s+)?old\s+norse/i, origin: 'Old Norse' },
  { pattern: /from\s+(?:the\s+)?(?:proto-)?germanic/i, origin: 'Germanic' },
  { pattern: /from\s+(?:the\s+)?(?:ancient\s+)?greek/i, origin: 'Greek' },
  { pattern: /from\s+(?:the\s+)?celtic/i, origin: 'Celtic' },
  { pattern: /from\s+(?:the\s+)?sanskrit/i, origin: 'Sanskrit' },
  { pattern: /from\s+(?:the\s+)?dutch/i, origin: 'Dutch' },
  { pattern: /from\s+(?:the\s+)?italian/i, origin: 'Italian' },
  { pattern: /from\s+(?:the\s+)?spanish/i, origin: 'Spanish' },
  { pattern: /from\s+(?:the\s+)?arabic/i, origin: 'Arabic' },
  { pattern: /borrowed\s+from\s+(?:the\s+)?latin/i, origin: 'Latin' },
  { pattern: /borrowed\s+from\s+(?:the\s+)?(?:old\s+)?french/i, origin: 'French' },
  { pattern: /of\s+(?:the\s+)?latin\s+origin/i, origin: 'Latin' },
  { pattern: /of\s+(?:the\s+)?(?:old\s+)?french\s+origin/i, origin: 'French' },
  { pattern: /of\s+(?:the\s+)?germanic\s+origin/i, origin: 'Germanic' },
]

export const MORPHOLOGICAL_PATTERNS = [
  { pattern: /^(.+)s$/, singular: (m) => m[1] }, // files -> file
  { pattern: /^(.+)es$/, singular: (m) => m[1] }, // boxes -> box
  { pattern: /^(.+)ies$/, singular: (m) => m[1] + 'y' }, // flies -> fly
  { pattern: /^(.+)ed$/, singular: (m) => m[1] }, // walked -> walk
  { pattern: /^(.+)ing$/, singular: (m) => m[1] }, // walking -> walk
  { pattern: /^(.+)er$/, singular: (m) => m[1] }, // bigger -> big
  { pattern: /^(.+)est$/, singular: (m) => m[1] }, // biggest -> big
]

export const INFLECTION_PATTERNS = [
  /plural\s+of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?\"[^>]*>/i,
  /past\s+(?:tense\s+)?(?:and\s+past\s+participle\s+)?of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?\"[^>]*>/i,
  /present\s+participle\s+of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?\"[^>]*>/i,
  /third-person\s+singular\s+.*?of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?\"[^>]*>/i,
  /simple\s+past\s+.*?of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?\"[^>]*>/i,
  /past\s+participle\s+of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?\"[^>]*>/i,
]

export const INFLECTION_FALLBACK_PATTERNS = [
  /plural\s+of\s+(\w+)/i,
  /past\s+(?:tense\s+)?(?:and\s+past\s+participle\s+)?of\s+(\w+)/i,
  /present\s+participle\s+of\s+(\w+)/i,
  /gerund\s+of\s+(\w+)/i,
  /third-person\s+singular\s+(?:simple\s+)?present\s+(?:indicative\s+)?(?:form\s+)?of\s+(\w+)/i,
  /simple\s+past\s+tense\s+and\s+past\s+participle\s+of\s+(\w+)/i,
  /comparative\s+form\s+of\s+(\w+)/i,
  /superlative\s+form\s+of\s+(\w+)/i,
  /past\s+participle\s+of\s+(\w+)/i,
  /inflection\s+of\s+(\w+)/i,
]

export const AFFIX_ORIGINS = {
  '-ly': 'Old English',
  '-ness': 'Old English',
  '-ment': 'French',
  '-tion': 'Latin',
  '-sion': 'Latin',
  '-ity': 'Latin',
  '-ous': 'Latin',
  '-ful': 'Old English',
  '-less': 'Old English',
  '-ward': 'Old English',
  '-wise': 'Old English',
  'un-': 'Old English',
  're-': 'Latin',
  'pre-': 'Latin',
  'dis-': 'Latin',
  'in-': 'Latin',
  'im-': 'Latin',
}