import { h, FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';

// Define signals for query options
export const categorySignal = signal(localStorage.getItem('game_category') || '');
export const authorSignal = signal(localStorage.getItem('game_author') || '');
export const centurySignal = signal(localStorage.getItem('game_century') || '');

interface QueryOptionsProps {
  isRemoteInterface?: boolean;
}

export const QueryOptions: FunctionComponent<QueryOptionsProps> = ({ isRemoteInterface = false }) => {
  const [selectedCategory, setSelectedCategory] = useState(categorySignal.value);
  const [author, setAuthor] = useState(authorSignal.value);
  const [century, setCentury] = useState(centurySignal.value);

  // Update state when signals change
  useEffect(() => {
    setSelectedCategory(categorySignal.value);
  }, [categorySignal.value]);

  useEffect(() => {
    setAuthor(authorSignal.value);
  }, [authorSignal.value]);

  useEffect(() => {
    setCentury(centurySignal.value);
  }, [centurySignal.value]);

  const handleCategoryChange = (e: Event) => {
    const newCategory = (e.target as HTMLSelectElement).value;
    setSelectedCategory(newCategory);
    localStorage.setItem('game_category', newCategory);
    categorySignal.value = newCategory;
  };

  const handleAuthorInput = (e: Event) => {
    const newAuthor = (e.target as HTMLInputElement).value;
    setAuthor(newAuthor);
    localStorage.setItem('game_author', newAuthor);
    authorSignal.value = newAuthor;
  };

  const handleCenturyChange = (e: Event) => {
    const newCentury = (e.target as HTMLSelectElement).value;
    setCentury(newCentury);
    localStorage.setItem('game_century', newCentury);
    centurySignal.value = newCentury;
  };

  // Category/Topic options
  const categoryOptions = [
    { value: "", text: "Random Topic" },
    // User Specified Categories
    { value: "bookshelf/466", text: "Philosophy & Ethics" },
    { value: "bookshelf/478", text: "Science (General)" },
    { value: "bookshelf/468", text: "Politics" },
    { value: "bookshelf/446", text: "History (General)" },
    { value: "bookshelf/458", text: "Literature" },
    { value: "bookshelf/460", text: "Music" },
    { value: "bookshelf/484", text: "Teaching & Education" },
    { value: "bookshelf/459", text: "Mathematics" },
    { value: "bookshelf/427", text: "Biographies" },
    // Additional Prominent Categories
    { value: "bookshelf/486", text: "Fiction (General)" },
    { value: "bookshelf/480", text: "Science-Fiction & Fantasy" },
    { value: "bookshelf/433", text: "Crime/Mystery" },
    { value: "bookshelf/453", text: "Humour" },
    { value: "bookshelf/467", text: "Poetry" },
    { value: "bookshelf/485", text: "Travel & Geography" },
  ];

  // Century options
  const centuryOptions = [
    { value: "", text: "Any Century" },
    { value: "15", text: "16th Century (1500s)" },
    { value: "16", text: "17th Century (1600s)" },
    { value: "17", text: "18th Century (1700s)" },
    { value: "18", text: "19th Century (1800s)" },
    { value: "19", text: "20th Century (1900s)" }
  ];

  // Standardized select component style classes
  const selectClasses = "w-full p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon focus:border-typewriter-ribbon appearance-none pr-8";
  
  // Standardized input component style classes
  const inputClasses = "w-full p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon focus:border-typewriter-ribbon";

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2 text-typewriter-ink">Search Options</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Topic/Category Selection */}
        <div>
          <label htmlFor="category-select" className="block mb-2 text-typewriter-ink">Category</label>
          <div className="relative">
            <select
              id="category-select"
              className={selectClasses}
              value={selectedCategory}
              onInput={handleCategoryChange}
              aria-label="Select category"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>{option.text}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-typewriter-ink">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Author Input */}
        <div>
          <label htmlFor="author-input" className="block mb-2 text-typewriter-ink">Author</label>
          <input
            id="author-input"
            type="text"
            className={inputClasses}
            placeholder="Enter author name"
            value={author}
            onInput={handleAuthorInput}
            aria-label="Author name"
          />
        </div>

        {/* Century Selection */}
        <div>
          <label htmlFor="century-select" className="block mb-2 text-typewriter-ink">Century</label>
          <div className="relative">
            <select
              id="century-select"
              className={selectClasses}
              value={century}
              onInput={handleCenturyChange}
              aria-label="Select century"
            >
              {centuryOptions.map(option => (
                <option key={option.value} value={option.value}>{option.text}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-typewriter-ink">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
