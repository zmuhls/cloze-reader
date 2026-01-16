# Cloze Reader: Recovering Deep Reading Through Algorithmic Assessment

## Introduction

The Cloze Reader transforms classic literature from the public domain into interactive vocabulary exercises powered by large language models. The application uses Google's Gemma-3 architecture to analyze passages from Project Gutenberg, select contextually appropriate words for deletion, and provide adaptive guidance through a conversational interface. Rather than generating novel text, the system surfaces forgotten public domain literature and invites users back to sustained engagement with individual texts—an act of critical resistance against generative systems designed for infinite, undifferentiated content production.

This project stages a recursive relationship: language models trained on prediction tasks are now used to generate prediction exercises for human readers. It forces us to ask what happens when assessment methodology and training methodology become instrumentalized through identical computational systems, when algorithmic selection replaces human pedagogical judgment, and when the boundary between human and machine comprehension becomes difficult to locate.

## Historical Context: Two Parallel Histories That Have Collapsed Into Each Other

### The Educational Assessment History: 1953

Wilson L. Taylor, a reading researcher, published a foundational paper introducing the cloze procedure as a tool for measuring reading comprehension. The methodology is deceptively simple: systematically delete words from a passage, ask readers to fill in the blanks, and score accuracy. Taylor argued that successful completion requires more than mere vocabulary recall. Instead, cloze tests measure contextual understanding—the capacity to integrate syntactic, semantic, pragmatic, and discourse cues to reconstruct deleted language.

The appeal was immediate and substantial. By the 1960s, cloze testing had become standard in American educational assessment, literacy research, and second-language instruction. The procedure offered educators what they desperately wanted: efficiency (many items from a single passage), objectivity (matching against answer keys rather than interpreting essays), and empirical rigor. Cloze tests promised to bypass the messiness of subjective evaluation while producing quantifiable measures of reading ability.

Cloze testing became embedded in the architecture of standardized testing across the United States. It shaped how literacy was defined, measured, and valued. The procedure was not merely an assessment instrument—it codified assumptions about what reading comprehension was and how it should be operationalized for institutional purposes.

### The AI Training History: 2018

In October 2018, researchers at Google, Facebook, and University of Washington published BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. The paper introduced masked language modeling (MLM) as a pre-training objective. The approach: randomly mask 15% of tokens in a sequence, train the model to predict the missing tokens from context, and iterate across internet-scale text corpora.

Remarkably, the researchers did not reference Taylor or invoke the language of educational assessment. They did not frame their work as a reinvention of the cloze procedure. Yet they had independently converged on cloze methodology as the core training objective for modern transformer models. The theoretical justification was different (learning contextualized embeddings rather than measuring comprehension), but the operational logic was identical: masking creates inference demands; understanding means predicting from context; success can be scored deterministically.

BERT and its successors (RoBERTa, ELECTRA, and countless variants) demonstrated that masked prediction is a powerful inductive bias for learning language. Models trained on MLM objectives developed robust representations of language structure, semantic relationships, and pragmatic patterns. The technique scaled to billions of parameters and trillions of tokens. It became foundational to modern large language models and consumer-facing AI systems.

The methodology migrated from educational psychology to computational linguistics because both domains had discovered something fundamental: understanding language, whether human or algorithmic, is fundamentally about prediction from context.

### The Convergence: Training Becomes Assessment, Assessment Becomes Training

Cloze testing and masked language modeling operate on identical premises:

- **Masking creates inference demands**: Removing a token forces reliance on surrounding structure rather than surface pattern matching.
- **Context integration**: Success requires synthesizing information across syntactic, semantic, and discourse boundaries.
- **Efficiency and scalability**: Many items can be processed rapidly; scoring is deterministic (for humans, match vs. non-match; for models, cross-entropy loss).
- **Variable difficulty**: Some blanks are trivial to fill (limited candidates, high probability); others require deep contextual reasoning.

Recent research explicitly draws these connections. Matsumori et al. (2023) used masked language models to generate open cloze questions for L2 English learners, treating MLM-equipped models as natural question generators. Ondov et al. (2024, NAACL) demonstrated that "the cloze training objective of Masked Language Models makes them a natural choice for generating plausible distractors for human cloze questions." Zhang & Hashimoto (2021) analyzed the inductive biases learned by masked tokens in transformer models, showing that these models acquire statistical and syntactic dependencies—precisely the linguistic phenomena that cloze tests aim to measure in human readers.

The Cloze Reader stages this convergence in a different way. While Gemma-3 (the model powering the system) was trained on next-token prediction rather than masked language modeling, the conceptual framework remains: we are using a language model trained on prediction tasks to generate prediction exercises for human learners. The system demonstrates that cloze generation and evaluation methodologies—once separate domains—are now instrumentalized through the same computational substrate. The boundary between training methodology and evaluation methodology has become permeable.

## Critical Framework: What This Convergence Reveals

### Recursive Assessment

Traditional assessment assumed a clean separation: educators design instruments; students complete them; data informs pedagogy. The Cloze Reader collapses this boundary. The same prediction task that trains state-of-the-art language models now serves as an assessment tool. This recursion raises uncomfortable questions. Can a model trained on surface pattern prediction—albeit at scale and with sophisticated architectures—generate assessment instruments that genuinely measure comprehension? Or does it reproduce the same surface-level pattern matching that enabled its own training? When human users solve cloze exercises generated by such a model, are they engaging in comprehension or replicating the model's own heuristics?

### Standardization Versus Serendipity

Educational cloze testing sought psychometric validity. Practitioners conducted readability studies, piloted passages with student populations, refined difficulty levels, and designed items to discriminate across ability ranges. The entire enterprise was about controlling and calibrating difficulty through human expertise.

The Cloze Reader abandons this control. It uses Gemma models trained on internet-scale text, applies them to the full Project Gutenberg corpus (70,000+ books with no curricular planning), and relies on statistical algorithms to select words for deletion. Difficulty emerges from the algorithmic interaction between passage content and model parameters, not from designed pedagogical intent. The same passage might yield wildly different difficulty levels depending on which words the model selects. What does "appropriate difficulty" mean when the system that determines it is a black box trained on patterns that nobody fully understands?

### Surface Cues Versus Deep Comprehension

Educational researchers have long critiqued cloze testing on the grounds that it measures local, sentence-level inference rather than global text comprehension. A reader might successfully complete a cloze passage by exploiting surface regularities and syntactic patterns without grasping the broader meaning of the text. Similarly, critics of masked language modeling note that models can achieve high accuracy by exploiting spurious statistical correlations rather than developing genuine semantic understanding. When a model trained on surface patterns generates cloze exercises, and human users solve those exercises using similar heuristics, where is comprehension happening? Are we measuring something real, or are we staging an elaborate performance of mutual statistical prediction?

### Authority and Transparency in Assessment Design

For most of the twentieth century, assessment authority was vested in institutional expertise. Teachers selected texts. Curriculum experts designed items. Psychometricians validated instruments. Authority was hierarchical, but it was also documentable: you could point to a specific teacher's choice or a specific item-analysis report. Assessment design was legible, even if it was unequally distributed.

The Cloze Reader distributes authority differently. The models it uses (Gemma-3) are open-weight models that anyone can download, inspect, and run locally. The system is designed for interrogation rather than institutional gatekeeping. You can examine the model's outputs, trace its decisions, modify its behavior, and deploy it on your own hardware. But this distribution of authority comes at a cost. Assessment design is now black-boxed in model weights rather than documented in curriculum guides. Patterns that determine difficulty are learned from billions of internet text samples rather than articulated through expert judgment. Authority is distributed, but it is also obscured.

### The Project Gutenberg Paradox

Project Gutenberg texts occupy a peculiar position in contemporary information ecology. These works are public domain—legally and technically available to everyone. Yet they are remarkably absent from popular consciousness. Most readers encounter these texts, if at all, through abridged excerpts in educational settings. The original, uncut texts languish in digital repositories.

Simultaneously, these same texts have been appropriated relentlessly as training data for large language models. Every major AI system trained on internet-scale corpora has incorporated Project Gutenberg texts. Commercial models have profited from and learned from this public archive without returning anything to the public sphere. The texts that should be most widely read have become most thoroughly invisible—present only as statistical patterns embedded in proprietary model weights.

The Cloze Reader inverts this trajectory. It surfaces Project Gutenberg texts. It makes them the primary content, not auxiliary training material. It asks users to read actual passages, carefully selected for quality but not processed or summarized. The design philosophy is explicit: bring people back to deep reading practices, precisely through engagement with a fill-in-the-blank game that generates genuinely novel exercises for each reader, each session. Unlike generative AI systems designed to produce infinite novel text, the Cloze Reader is designed to deepen engagement with finite, singular texts.

This is not a return to pre-digital reading practices. The system is thoroughly computational. But it is a return to the idea that reading means sustained engagement with specific texts, that repetition and variation can deepen understanding, and that computational systems can serve that deepening rather than obscuring it.

## Architecture and Data Flow

### System Overview

The Cloze Reader is a vanilla JavaScript application with a minimal FastAPI backend. The entire frontend runs in the browser using ES6 modules; there is no build step. This architectural choice prioritizes transparency and modifiability—users can inspect every component without specialized tooling.

### Application Flow

When a user loads the application, the initialization sequence follows a precise path:

1. **Welcome Overlay** displays onboarding instructions for first-time users.
2. **Game Engine Initialization** loads book data and AI services.
3. **First Round Generation** creates the initial cloze exercise.
4. **UI Activation** reveals the interactive game interface.

```tree
Page Load → app.js initialization
├─ welcomeOverlay.js → First-time user onboarding
├─ clozeGameEngine.js → Game state initialization
│  ├─ bookDataService.js → Stream from Hugging Face Datasets API
│  │  ├─ Primary: manu/project_gutenberg (70,000+ books)
│  │  └─ Fallback: Local embedded canonical works
│  ├─ aiService.js → Gemma-3-27b model selection and word generation
│  │  ├─ Level-based vocabulary constraints
│  │  ├─ Passage analysis and candidate filtering
│  │  └─ Distribution algorithm for blank placement
│  └─ Content quality filtering (statistical analysis)
└─ leaderboardService.js → localStorage persistence

User Interaction Loop:
├─ Input validation → app.js
├─ Chat interface → chatInterface.js
│  └─ conversationManager.js → AI conversation state
├─ Answer submission → clozeGameEngine.js scoring
└─ Round progression → Level advancement logic
```

### Core Module Interactions

**bookDataService.js** streams text from the Hugging Face Datasets API, accessing the manu/project_gutenberg dataset containing 70,000+ public domain texts. When streaming fails or APIs become unavailable, the system falls back to locally embedded canonical works (Pride and Prejudice, Tom Sawyer, Great Expectations, and others). Book selection is level-aware: levels 1-2 draw from 1900s publications; levels 3-4 from the 1800s; levels 5+ from any historical period.

**aiService.js** handles all AI operations using Gemma-3-27b via OpenRouter. The same model handles word selection, hint generation, literary contextualization, and conversational responses. For local deployment, the system automatically switches to Gemma-3-12b when `?local=true` is appended to the URL, connecting to port 1234 (compatible with LM Studio and similar tools).

Word selection follows a sophisticated multi-step process: level-based constraints define vocabulary difficulty ranges; passage analysis identifies candidate words while avoiding capitalized words, proper nouns, sentence beginnings, and artifacts; a distribution algorithm ensures blanks are spread throughout the passage; validation filtering confirms words exist in the passage and meet length requirements.

**chatInterface.js** provides word-level assistance through a modal-based interface. Users can ask questions about grammar, meaning, context, or request clues. The system preserves chat history per blank across the entire round, allowing for progressive disclosure of information.

**leaderboardService.js** manages high scores, player statistics, and localStorage persistence. The system tracks highest level reached, round numbers, total passages passed and attempted, and longest consecutive success streaks. Leaderboard data resets on each page load (ensuring fresh competition), but performance statistics persist within a session.

### Content Quality Filtering

The passage extraction system includes sophisticated quality detection to avoid dictionary entries, academic references, technical documentation, and formatting artifacts. The system analyzes capitalization ratios, punctuation density, and sentence structure. It applies pattern recognition for academic material (citations, abbreviations, etymology brackets, Roman numeral references). It detects dictionary-specific formatting (hash symbols used for entry organization) and technical terminology. A progressive scoring system rejects passages above a quality threshold.

### Difficulty Progression

The game implements level-aware difficulty scaling:

- **Levels 1-5**: 1 blank per passage, easier vocabulary (4-7 letters), full hints available
- **Levels 6-10**: 2 blanks per passage, medium vocabulary (4-10 letters), partial hints
- **Levels 11+**: 3 blanks per passage, challenging vocabulary (5-14 letters), minimal hints

Level advancement requires passing a single round. Each round contains two passages. Scoring is strict: for 1 blank, 100% accuracy; for 2 blanks, both correct; for 3+ blanks, all but one correct.

## Data Source and Content Pipeline

### Hugging Face Datasets Integration

The primary data source is the manu/project_gutenberg dataset available at [https://huggingface.co/datasets/manu/project_gutenberg](https://huggingface.co/datasets/manu/project_gutenberg). This dataset contains full texts from 70,000+ public domain works, updated continuously as new texts enter the public domain. The system uses lazy loading and on-demand processing, streaming excerpts rather than loading entire books into memory.

### Content Processing

Books undergo sophisticated cleaning to remove Project Gutenberg metadata (scanning notes, OCR artifacts, structural markers), chapter headers, page numbers, and formatting noise. The system identifies the actual narrative content and validates it for sufficient length and narrative structure. This processing is deferred until a book is selected for gameplay, optimizing overall performance.

### Quality Validation

Passages are subject to multiple quality checks. The system analyzes statistical properties (capitalization density, punctuation distribution, sentence length variance), applies pattern detection for reference material and technical content, and screens for dictionary-specific formatting. A passage that fails quality validation is rejected and the system selects a different excerpt or book.

## Technology Stack and Deployment

### Frontend Architecture

The application uses vanilla JavaScript with ES6 modules. There is no build process. This architectural choice is intentional: it keeps the machinery visible and modifiable rather than obscured behind tooling. The application is Progressive Web App (PWA) compatible, with manifest configuration supporting installation on mobile devices.

### Backend and API Integration

The FastAPI server (`app.py`) serves static files and injects API credentials securely into the browser via meta tags. This approach allows the system to handle sensitive credentials (like OpenRouter API keys) without exposing them in client-side code.

### AI Models

**Production Deployment**: Gemma-3-27b via OpenRouter API

**Local Deployment**: Gemma-3-12b on port 1234 (LM Studio, ollama, or OpenAI-compatible servers)

The model selection prioritizes:

- **Open-weight models**: Enables local deployment and inspection
- **Consistent architecture**: Same model family across production and local deployment
- **Performance**: Sufficient scale for sophisticated language tasks while remaining computationally feasible

### State Management

All game state persists in `localStorage`. There is no backend database. Storage keys are:

- `cloze-reader-leaderboard`: Top 10 high scores
- `cloze-reader-player`: Player profile (initials, session metadata)
- `cloze-reader-stats`: Comprehensive performance analytics

This client-side approach ensures the assessment system is fully auditable. All data transformations occur transparently in browser-side code, not on remote servers.

## Quick Start

### Docker Deployment (Recommended)

```bash
# Build the image
docker build -t cloze-reader .

# Run with OpenRouter API key
docker run -p 7860:7860 -e OPENROUTER_API_KEY=your_key_here cloze-reader

# Access at http://localhost:7860
```

### Local Python Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python app.py

# Access at http://localhost:7860
```

### Local Development with Simple HTTP Server

```bash
# Minimal setup without FastAPI
python -m http.server 8000

# Access at http://localhost:8000
```

### Local LLM Integration

To run with a local language model server (no API key required):

```bash
# Start local LLM server on port 1234 (LM Studio, ollama, or similar)
# Then access the application with:
http://localhost:8000?local=true
```

### Environment Variables

- `OPENROUTER_API_KEY`: Required for production deployment (get from [https://openrouter.ai](https://openrouter.ai))
- `HF_API_KEY`: Optional, for accessing Hugging Face APIs
- `HF_TOKEN`: Optional, for Hugging Face Hub leaderboard integration

## Development Commands

Use the provided Makefile for convenience:

```bash
make install          # Install Python and Node.js dependencies
make dev             # Start development server (simple HTTP)
make dev-python      # Start FastAPI development server
make docker-build    # Build Docker image
make docker-run      # Run Docker container
make docker-dev      # Full Docker development environment
make clean           # Clean build artifacts and cache
make logs            # View Docker container logs
make stop            # Stop Docker containers
```

## Critical Questions This System Poses

1. **Recursive Collapse**: What happens when training methodology becomes assessment tool, and assessment data becomes training data? Where is the meaningful boundary?

2. **Pedagogical Authority**: Can algorithmic selection of passages and words, guided by statistical patterns learned from internet-scale corpora, capture what human educators mean by "appropriate difficulty"?

3. **The Nature of Comprehension**: When a model trained on surface pattern prediction generates cloze exercises, and humans solve those exercises using similar heuristics, what is being measured? Is comprehension happening, or are we staging an elaborate performance of mutual statistical inference?

4. **Institutional Authority**: Traditional assessment vested authority in documented expert judgment. This system distributes authority through open-weight models and client-side code, making it interrogable rather than institutional. What is gained or lost in this distribution?

5. **Reading in the Age of Algorithmic Text Generation**: When generative systems produce infinite novel text, what does it mean to ask users to engage deeply with finite, singular public domain texts? Is this a form of resistance, or capitulation to the same systems that trained the models?

6. **Data Extraction and Repatriation**: Public domain texts have been appropriated relentlessly for AI training. What does it mean to surface these texts, return them to visibility, and ask people to read them directly rather than through algorithmic summaries?

## Technical Details and Error Handling

### AI Service Resilience

The system implements multiple fallback layers:

1. **Retry with exponential backoff**: Up to 3 attempts with increasing delays
2. **Response extraction hierarchy**: Primary (message.content), secondary (reasoning field), tertiary (reasoning_details array), final (regex pattern matching)
3. **Manual word selection**: If AI fails, the system falls back to statistical selection based on content analysis
4. **Generic hint generation**: Fallback responses based on question type when AI service is unavailable

### Content Service Resilience

1. **HF API availability check**: Test connection before streaming attempts
2. **Preloaded content**: Cached books for immediate access
3. **Local book fallback**: 10 embedded classics guarantee offline functionality
4. **Quality validation retry**: Multiple attempts with different passage selections if quality filtering rejects initial selections
5. **Timeout handling**: 15-second request timeout with automatic fallback to sequential processing

## On This Codebase's Design Philosophy

The technical decisions in this codebase reflect the conceptual interests outlined above:

- **Vanilla JavaScript, no build step**: Keeps machinery visible rather than obscured behind tooling
- **Open-weight Gemma models**: Enables inspection, local deployment, and interrogation of the assessment generator
- **Streaming from Project Gutenberg**: Makes the pipeline reproducible without proprietary content
- **Local LLM support**: Removes dependency on API providers; you can run the entire system on personal hardware
- **No backend database**: All state is client-side localStorage; the assessment system is fully auditable
- **Vanilla HTML and CSS**: Aesthetic choices reflect mid-century design rather than contemporary web trends, creating temporal distance between the user and algorithmic systems

The goal is not to resolve the tensions between human assessment and algorithmic generation, between deep reading and computational efficiency, between transparent pedagogy and black-boxed AI. Instead, the goal is to **stage these tensions**—to make them experientially tangible through gameplay. Every passage you encounter is a collision between seventy years of educational assessment theory and seven years of masked language modeling. Every blank you fill is an act of both comprehension and statistical prediction.

## References and Further Reading

Recent research connecting cloze assessment and masked language modeling:

- Matsumori, A., et al. (2023). CLOZER: Generating open cloze questions with masked language models. Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing.
- Ondov, B., et al. (2024). Masked language models as natural generators for cloze questions. Proceedings of the 2024 Conference of the North American Chapter of the Association for Computational Linguistics (NAACL).
- Zhang, Y., & Hashimoto, K. (2021). What do language models learn about the structure of their language? Proceedings of the 59th Annual Meeting of the Association for Computational Linguistics.

## Attribution

This project was created by [Zach Muhlbauer](https://huggingface.co/milwright) at the CUNY Graduate Center. The application draws on extensive research in both educational assessment and natural language processing, bringing two disciplinary histories into dialogue through interactive gameplay.

For more information, visit the development space at [https://huggingface.co/spaces/milwright/cloze-reader](https://huggingface.co/spaces/milwright/cloze-reader) or the underlying dataset at [https://huggingface.co/datasets/manu/project_gutenberg](https://huggingface.co/datasets/manu/project_gutenberg).

---

*The Cloze Reader invites you to encounter public domain literature on its own terms, to practice contextual reasoning in real time, and to confront the strange convergence between how humans and machines understand language through prediction.*
