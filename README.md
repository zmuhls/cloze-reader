# Cloze Reader

An interactive reading comprehension game using AI to generate cloze (fill-in-the-blank) exercises from public domain literature.

## Overview

Cloze Reader is an interactive reading comprehension game that generates cloze, or fill-in-the-blank, exercises from public domain literature. It transforms passages from Project Gutenberg into adaptive vocabulary exercises and uses Gemma-3 models to identify contextually meaningful words to remove before returning the passage as a playable text. The interface supports first-letter and last-letter cues, along with four queryable word clues available through a chat layer. Rather than producing new prose, the system foregrounds historical and literary texts that many readers are unlikely to encounter elsewhere and asks players to work within the constraints of an existing passage.

Cloze Reader draws from a Project Gutenberg dataset hosted on Hugging Face, which provides a structured, serverless source for sampling excerpts from public-domain books ([manu/project_gutenberg](https://huggingface.co/datasets/manu/project_gutenberg)). Project Gutenberg texts are widely used and repeatedly absorbed into benchmark and pretraining corpora, even as the books themselves remain long, dense, and often unread in full. This project treats that condition as a design problem. By re-presenting these works through a constrained reading game, Cloze Reader brings readers back to the text itself and centers a practice of sustained, contextual inference whose novelty lies in repetition, attention, and difficulty, rather than in generative output.

## Context

Wilson L. Taylor introduced the cloze procedure in the early 1950s as a way to measure reading comprehension by deleting words from a passage and asking readers to supply them from context, a method that became common in U.S. educational assessment by the 1960s. Decades later, AI research repurposed this same logic for training, masking tokens and rewarding models for accurate contextual prediction. Cloze Reader ties these histories together by using Gemma-3-27B and Gemma-3-12B as open-weight models, accessed through OpenRouter or run locally via Ollama, to generate human-facing cloze exercises from Project Gutenberg's catalogue. The system uses prediction to scaffold reading, returning the work of inference to the reader rather than outsourcing it to the machine.

## Architecture

```tree
Page Load → app.js
├─ bookDataService.js → Hugging Face Datasets API (manu/project_gutenberg)
├─ clozeGameEngine.js → Game logic and word selection
├─ aiService.js → Gemma-3-27b word generation and hints
└─ leaderboardService.js → localStorage persistence

User Flow:
├─ Input validation → app.js
├─ Chat help → chatInterface.js
├─ Answer submission → clozeGameEngine.js scoring
└─ Level progression → Round advancement
```

### Key Modules

- **bookDataService.js**: Streams from 70,000+ Project Gutenberg texts with local fallback classics
- **aiService.js**: Gemma-3-27b (OpenRouter) for production; Gemma-3-12b on port 1234 for local deployment
- **clozeGameEngine.js**: Level-aware difficulty, word selection, content quality filtering
- **chatInterface.js**: Socratic hints per blank with persistent conversation history
- **leaderboardService.js**: Top 10 high scores, player stats via localStorage

### Difficulty System

- **Levels 1-5**: 1 blank, easier vocab (4-7 letters), full hints
- **Levels 6-10**: 2 blanks, medium vocab (4-10 letters), partial hints
- **Levels 11+**: 3 blanks, challenging vocab (5-14 letters), minimal hints

Scoring: 100% accuracy required for 1 blank, both correct for 2 blanks, all but one for 3+ blanks.

## Data Pipeline

**Primary source**: [manu/project_gutenberg](https://huggingface.co/datasets/manu/project_gutenberg) on Hugging Face (70,000+ texts, continuously updated)

**Content processing**:

- Removes Project Gutenberg metadata, chapter headers, page numbers
- Statistical quality filtering: caps ratio, punctuation density, sentence structure
- Pattern detection for dictionaries, technical material, references
- Quality threshold > 3 rejects passages

**Level-aware selection**:

- Levels 1-2: 1900s texts
- Levels 3-4: 1800s texts
- Levels 5+: Any period

## Technology Stack

**Frontend**: Vanilla JavaScript ES6 modules, no build process

**Backend**: FastAPI for static serving and secure API key injection

**Models**:

- Production: Gemma-3-27b via OpenRouter
- Local: Gemma-3-12b on port 1234 (LM Studio, ollama, or OpenAI-compatible)

**State**: localStorage only (no backend database)

## Quick Start

### Docker (Recommended)

```bash
docker build -t cloze-reader .
docker run -p 7860:7860 -e OPENROUTER_API_KEY=your_key cloze-reader
# Access at http://localhost:7860
```

### Local Development

```bash
# With FastAPI
pip install -r requirements.txt
python app.py
# Access at http://localhost:7860

# Simple HTTP server
python -m http.server 8000
# Access at http://localhost:8000
```

### Local LLM

```bash
# Start LLM server on port 1234 (LM Studio, etc.)
# Then access with:
http://localhost:8000?local=true
```

## Environment Variables

- `OPENROUTER_API_KEY`: Required for production (get from [openrouter.ai](https://openrouter.ai))
- `HF_API_KEY`: Optional, for Hugging Face APIs
- `HF_TOKEN`: Optional, for Hub leaderboard sync

## Development Commands

```bash
make install          # Install Python and Node.js dependencies
make dev             # Start dev server (simple HTTP)
make dev-python      # Start FastAPI dev server
make docker-build    # Build Docker image
make docker-run      # Run container
make docker-dev      # Full Docker dev environment
make clean           # Clean build artifacts
make logs            # View container logs
make stop            # Stop containers
```

## Design Philosophy

- **Vanilla JS, no build step**: Keeps code visible and modifiable
- **Open-weight Gemma models**: Enables local deployment and inspection
- **Streaming from Project Gutenberg**: Reproducible without proprietary content
- **Local LLM support**: No API dependency
- **No backend database**: Full client-side auditability
- **Mid-century aesthetic**: Temporal distance from contemporary algorithmic systems

## Error Handling

**AI Service**:

1. Retry with exponential backoff (up to 3 attempts)
2. Response extraction hierarchy (message.content → reasoning → reasoning_details → regex)
3. Manual word selection fallback
4. Generic hint generation fallback

**Content Service**:

1. HF API availability check before streaming
2. Preloaded book cache
3. 10 embedded classics guarantee offline functionality
4. Quality validation retry with different passages
5. 15-second request timeout with sequential processing fallback

## Critical Questions

1. What happens when training and assessment methodologies use identical computational systems?
2. Can algorithmic selection trained on internet-scale data capture pedagogical intent?
3. When both humans and models solve prediction tasks using similar heuristics, where is comprehension?
4. What's gained/lost when authority shifts from institutional expertise to interrogable algorithms?
5. What does deep engagement with finite texts mean in an age of infinite algorithmic generation?
6. How do we surface public domain texts that have been appropriated relentlessly as training data?

## References

- Matsumori, A., et al. (2023). CLOZER: Generating open cloze questions with masked language models. EMNLP.
- Ondov, B., et al. (2024). Masked language models as natural generators for cloze questions. NAACL.
- Zhang, Y., & Hashimoto, K. (2021). What do language models learn about the structure of their language? ACL.

## Attribution

Created by [Zach Muhlbauer](https://huggingface.co/milwright) at CUNY Graduate Center.

Development space: [huggingface.co/spaces/milwright/cloze-reader](https://huggingface.co/spaces/milwright/cloze-reader)

Dataset: [manu/project_gutenberg](https://huggingface.co/datasets/manu/project_gutenberg)
