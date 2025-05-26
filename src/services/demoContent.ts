// Demo/fallback content for testing button functionality
export const DEMO_PASSAGE = {
  paragraphs: [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
    "Reading comprehension is an essential skill that develops through practice and exposure to various texts."
  ],
  metadata: {
    title: "Demo Passage",
    author: "Test Author",
    id: 1,
    factoid: "This is a demo passage for testing the Cloze Reader application."
  }
};

export const DEMO_ANSWERS = [
  { paragraphIndex: 0, wordIndex: 3, answer: "fox" },
  { paragraphIndex: 0, wordIndex: 7, answer: "lazy" },
  { paragraphIndex: 1, wordIndex: 2, answer: "essential" }
];
