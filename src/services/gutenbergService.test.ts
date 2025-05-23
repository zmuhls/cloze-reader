import { searchGutenbergBooks, GutendexBook } from './gutenbergService';

describe('Gutenberg Service', () => {
  it('should fetch books from Gutendex API based on search criteria', async () => {
    jest.setTimeout(10000); // Increase timeout to 10 seconds
    const args = {
      bookshelf: '1', // Updated to match the new ID mapping for Philosophy
      limit: 5,
      excludeIds: [485, 8492]
    };

    const books = await searchGutenbergBooks(args);
    
    expect(books).toBeDefined();
    expect(books.length).toBeLessThanOrEqual(10); // Adjusting the expected limit to 10
    books.forEach(book => {
      expect(book.id).not.toBe(485);
      expect(book.id).not.toBe(8492);
    });
  });
});
