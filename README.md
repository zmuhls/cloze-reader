# Cloze Reader Game

This is a web-based game where users can infer redacted words in passages fetched from Project Gutenberg.

The game utilizes tool calling capabilities to interact with external services. Specifically, it uses an OpenRouter tool to communicate with a language model.

The language model plays a crucial role in this game by:

- Fetching passages from Project Gutenberg via the Gutendex API.
- Redacting tokens from the fetched passages to create the cloze test format.

This project is deployed on GitHub Pages via a GitHub Actions workflow.

## How to Play

1. Click "Start Game" to fetch a passage.
2. Read the passage—some words will be hidden (cloze deletions).
3. Type your guesses for the missing words in the blanks.
4. Submit your answers to see which are correct.
5. Continue to the next round or try a new passage.

You can adjust settings such as difficulty and source book in the options menu.

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

## Codebase Structure

```mermaid
graph TD
    %% Main Entry Points
    Main[main.ts] --> App[app.tsx]
    
    %% Core Services
    GameLogic[gameLogic.ts] --> GutenbergService[gutenbergService.ts]
    GutenbergService --> LLMService[llmService.ts]
    Main --> GameLogic
    App --> GameLogic
    
    %% Data Types and Utilities
    GutenbergTypes[gutenbergTypes.ts] --> GutenbergService
    GutenbergTypes --> LLMService
    EnvironmentConfig[environmentConfig.ts] --> GutenbergService
    EnvironmentConfig --> LLMService
    ErrorHandling[errorHandling.ts] --> GutenbergService
    ErrorHandling --> GameLogic
    ErrorHandling --> LLMService
    CacheValidation[cacheValidation.ts] --> GameLogic
    DebugLog[debugLog.ts] --> GameLogic
    DebugLog --> GutenbergService
    DebugLog --> LLMService
    
    %% UI Components
    App --> WelcomeOverlay[WelcomeOverlay.tsx]
    App --> SettingsFooter[SettingsFooter.tsx]
    SettingsFooter --> ApiConfiguration[ApiConfiguration.tsx]
    SettingsFooter --> QueryOptions[QueryOptions.tsx]
    SettingsFooter --> GameSettings[GameSettings.tsx]
    
    %% External Services
    GutenbergService --> HuggingFaceAPI[Hugging Face Datasets API]
    LLMService --> OpenRouterAPI[OpenRouter API]
    
    %% Data Flow
    HuggingFaceAPI --> BookData[Book Data]
    BookData --> GutenbergService
    GutenbergService --> Passages[Processed Passages]
    Passages --> GameLogic
    GameLogic --> RedactedPassages[Redacted Passages]
    RedactedPassages --> App
    
    %% User Interaction
    User([User]) --> App
    App --> User
    
    %% Subgraphs for Organization
    subgraph "Core Services"
        GameLogic
        GutenbergService
        LLMService
    end
    
    subgraph "UI Components"
        WelcomeOverlay
        SettingsFooter
        ApiConfiguration
        QueryOptions
        GameSettings
    end
    
    subgraph "Utilities"
        EnvironmentConfig
        ErrorHandling
        CacheValidation
        DebugLog
        GutenbergTypes
    end
    
    subgraph "External APIs"
        HuggingFaceAPI
        OpenRouterAPI
    end
```

*Diagram updated on 5/25/2025*
