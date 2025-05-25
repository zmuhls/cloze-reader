# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based cloze deletion practice game that fetches literature passages from Project Gutenberg and challenges users to fill in strategically redacted words. Uses LLM services for intelligent passage processing and word selection.

## Development Commands

- `npm run dev` - Start development server (port 1234)
- `npm run build` - Build for production (GitHub Pages)
- `npm run test` - Run Jest tests
- `npm run deploy` - Deploy to GitHub Pages
- `npm run fetch-data` - Fetch Gutenberg data (scripts/)

## Architecture

**Tech Stack:** Preact + TypeScript + Tailwind CSS + Parcel

**Core Services:**
- `gameLogic.ts` - Central game state, round management, word redaction algorithms
- `gutenbergService.ts` - Primary data source (HuggingFace Project Gutenberg API)
- `localGutenbergService.ts` - Local data fallback with sample.json
- `llmService.ts` - OpenRouter LLM integration for passage enhancement
- `environmentConfig.ts` - Environment detection and API configuration

**Data Flow Pattern:**
1. Local data (data/gutenberg/sample.json)
2. HuggingFace API (primary remote source)  
3. LLM processing (OpenRouter) for difficult passages
4. 24-hour localStorage caching

**Component Structure:**
- `app.tsx` - Main app with welcome overlay state
- `WelcomeOverlay.tsx` - Game setup and configuration
- Settings components handle API keys, query filters, and game difficulty
- Preact signals manage reactive settings state

**Key Patterns:**
- Graceful degradation with multiple fallback data sources
- Smart word redaction based on difficulty gradients
- Preserve game progress when fetching new passages
- Typewriter aesthetic with vintage paper theme

## Important Notes

- Always test with both local and remote data sources
- Maintain 24-hour cache invalidation for passages
- Follow existing error handling patterns with multiple fallbacks
- Use Preact signals for reactive state (not React hooks)
- Respect rate limits for HuggingFace and OpenRouter APIs