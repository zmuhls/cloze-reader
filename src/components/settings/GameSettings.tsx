import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';

// Define signals for category and author
export const categorySignal = signal(localStorage.getItem('game_category') || '');
export const authorSignal = signal(localStorage.getItem('game_author') || '');

export const GameSettings = () => {
  const [selectedCategory, setSelectedCategory] = useState(categorySignal.value);
  const [author, setAuthor] = useState(authorSignal.value);

  // Update state when signals change
  useEffect(() => {
    setSelectedCategory(categorySignal.value);
  }, [categorySignal.value]);

  useEffect(() => {
    setAuthor(authorSignal.value);
  }, [authorSignal.value]);

  const handleCategoryChange = (e: Event) => {
    const newCategory = (e.target as HTMLSelectElement).value;
    setSelectedCategory(newCategory);
    localStorage.setItem('game_category', newCategory);
    categorySignal.value = newCategory; // Update the signal
    // Note: Game logic will need to listen to this signal or receive a callback
  };

  const handleAuthorInput = (e: Event) => {
    const newAuthor = (e.target as HTMLInputElement).value;
    setAuthor(newAuthor);
    localStorage.setItem('game_author', newAuthor);
    authorSignal.value = newAuthor; // Update the signal
    // Note: Game logic will need to listen to this signal or receive a callback
  };

  const categoryOptions = [
    { value: "", text: "Random Topic" },
    { value: "adventure", text: "Adventure" },
    { value: "romance", text: "Romance" },
    { value: "science", text: "Science" },
    { value: "history", text: "History" },
    { value: "philosophy", text: "Philosophy" }
  ];

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2 text-typewriter-ink">Game Settings</h3>
      <div className="mb-4">
        <label htmlFor="category-select" className="block mb-2 text-typewriter-ink">Passage Topic</label>
        <div className="relative">
          <select
            id="category-select"
            className="w-full p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:border-typewriter-ribbon appearance-none pr-8"
            value={selectedCategory}
            onInput={handleCategoryChange}
          >
            {categoryOptions.map(option => (
              <option value={option.value}>{option.text}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-typewriter-ink">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="author-input" className="block mb-2 text-typewriter-ink">Author (optional)</label>
        <input
          id="author-input"
          type="text"
          className="w-full p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:border-typewriter-ribbon"
          placeholder="Author (optional)"
          value={author}
          onInput={handleAuthorInput}
        />
      </div>
    </div>
  );
};
