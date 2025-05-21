# Cloze Reader Game

This is a web-based game where users can infer redacted words in passages fetched from Project Gutenberg.

The game utilizes tool calling capabilities to interact with external services. Specifically, it uses an OpenRouter tool to communicate with a language model.

The language model plays a crucial role in this game by:
- Fetching passages from Project Gutenberg via the Gutenberg service.
- Redacting tokens from the fetched passages to create the cloze test format.

This project is deployed on GitHub Pages via a GitHub Actions workflow.

## How to Play

(Instructions on how to play the game would go here)

## Development

(Information on setting up and running the project locally would go here)

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
    LLMService[LLM Service]
    Gutenberg[(Project Gutenberg)]

    %% Component Relations & Data Flow
    User -->|Interacts with| UI
    UI -->|Displays to| User
    UI -->|Settings changes| App
    App -->|Renders| UI
    App -->|Calls| GameLogic
    GameLogic -->|Fetches passages| LLMService
    LLMService -->|Queries via OpenRouter| Gutenberg
    Gutenberg -->|Returns passages| LLMService
    LLMService -->|Passages with metadata| GameLogic
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

*Diagram generated on 5/21/2025, 11:24:23 AM*
