# Gutenberg Cloze Reader

Welcome to the Gutenberg Cloze Reader!

This game presents excerpts from public domain books from Project Gutenberg. Fill in the blanked-out words using context clues, like a language model. Get over half right to advance; each round increases in difficulty.

## How to Play

- Fill in the blanked-out words in classic literature excerpts.
- Use context clues to predict the missing words.
- Get more than half correct to advance to the next round.
- Rounds become progressively more challenging.

## Game Controls

- **Category Selection:** Choose a topic or keep it random.
- **Author Input:** Optionally specify an author.
- **Hint Button:** Get a hint for a selected word (limited uses).
- **Submit Button:** Check your answers.

**Note:** An OpenRouter API key is recommended for the best experience (add in Settings).

---

## Features

- Interactive token prediction challenges
- TypeScript implementation for type safety
- Tailwind CSS for styling
- Parcel bundler for fast development experience

## Getting Started

### Prerequisites

- Node.js (version 14.x or higher recommended)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/zmuhls/lm-erasure-game.git
   cd lm-erasure-game
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:1234`

## Building for Production

To create an optimized production build:

```
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Deployment

This project is set up for easy deployment to GitHub Pages:

```
npm run deploy
```

This will build the project and deploy it to the `gh-pages` branch of your repository.

## Project Structure

```
/
├── public/            # Public assets and entry HTML
│   ├── index.html     # Main HTML entry point
│   └── index.js       # JavaScript entry point
├── src/               # TypeScript source code
│   ├── main.ts        # Main TypeScript file
│   └── styles.css     # CSS styles
├── package.json       # Project dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with TypeScript, Tailwind CSS, and Parcel
