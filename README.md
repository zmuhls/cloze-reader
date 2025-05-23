# Cloze Reader Game

This is a web-based game where users can infer redacted words in passages fetched from Project Gutenberg.

The game utilizes tool calling capabilities to interact with external services. Specifically, it uses an OpenRouter tool to communicate with a language model.

The language model plays a crucial role in this game by:

- Fetching passages from Project Gutenberg via the Gutendex API.
- Redacting tokens from the fetched passages to create the cloze test format.

This project is deployed on GitHub Pages via a GitHub Actions workflow.

## How to Play

(Instructions on how to play the game would go here)

## Development

To run this project locally:

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser at `http://localhost:1234`

The application connects directly to the Gutendex API (https://gutendex.com/books) and does not require any local server setup.

Note: For GitHub Pages deployment, make sure to:
1. Run `npm run build` to create optimized files
2. Run `npm run deploy` to publish to GitHub Pages

## Technologies Used

- React
- TypeScript
- Parcel
- Tailwind CSS
- OpenRouter (via tool calling)
- Project Gutenberg API (via service)

## License

This project is licensed under the GPL-3.0 License.

## Project Architecture

```mermaid
graph TD
    %% Main Components
    User([User])
    UI[Game UI Components]
    App[App Component]
    GameLogic[Game Logic Service]
    GutenbergService[Gutenberg Service]
    GutendexAPI[(Gutendex API)]
    LLMService[LLM Service]
    
    %% Component Relations & Data Flow
    User -->|Interacts with| UI
    UI -->|Displays to| User
    UI -->|Settings changes| App
    App -->|Renders| UI
    App -->|Calls| GameLogic
    GameLogic -->|Requests passages| GutenbergService
    GutenbergService -->|Direct API calls| GutendexAPI
    GutendexAPI -->|Returns book data| GutenbergService
    GutenbergService -->|Returns passages| GameLogic
    LLMService -->|Fallback when needed| GutenbergService
    GameLogic -->|Applies redactions| GameLogic
    GameLogic -->|Redacted passages| UI
    User -->|Submits answers| GameLogic
    GameLogic -->|Feedback & progression| UI

    %% Subcomponents
    subgraph "UI Components"
        WelcomeOverlay
        GameArea
        QueryOptions
        ApiConfig
        SettingsFooter
    end

    %% Game Logic Functions
    subgraph "Game Logic"
        ChooseRedactions
        RenderRound
        HandleSubmission
        ExtractKeyTerms
    end
```

*Diagram updated on 5/23/2025*
