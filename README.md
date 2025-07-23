# Etyma

**Illuminating Word Origins**

A minimalist web app that reveals the etymological origins of English words by coloring them according to their linguistic heritage. Inspired by Gideon Ben-Ami's video (https://www.youtube.com/watch?v=_W5r6jYZdTA).

## Features

- **Real-time Etymology Analysis** - Enter any English text and see each word colored by its language of origin
- **Wiktionary Integration** - Fetches etymology data directly from Wiktionary's comprehensive database
- **Smart Word Parsing** - Handles compound words, plurals, verb tenses, and morphological variations
- **Visual Legend** - Dynamic color-coded legend showing only the languages present in your text
- **Distribution Chart** - Pie chart visualization of etymological composition
- **Responsive Design** - Clean, modern interface that works on all devices
- **Smooth Animations** - Elegant fade-in transitions and scroll behavior
- **Smart Caching** - Local storage caches etymology lookups to reduce API calls (daily refresh)

## Language Origins Detected

- Latin
- Old English
- French
- Greek
- Old Norse
- Germanic
- Celtic
- Sanskrit
- Dutch
- Italian
- Spanish
- Arabic
- And more...

## How It Works

1. Enter English text in the input field
2. Click "Analyze" to process the text
3. Watch as each word is colored according to its etymological origin
4. Hover over words to see detailed origin information
5. View the legend and distribution chart below

The app intelligently handles:
- **Compound words** (e.g., "baseball" → "base" + "ball")
- **Inflected forms** (e.g., "files" → "file")
- **Morphological variations** (e.g., "activated" → "activat" + "-ed")
- **Network errors** with graceful fallback and retry options

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/extreme-coder/etyma.git
cd etyma

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Wiktionary API** - Etymology data source
- **Tailwind CSS** - Utility-first styling

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details.