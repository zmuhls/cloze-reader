# TO DO LIST

1. Review and document the `excludeIds` property in `SearchGutenbergBooksArgs`:
   - Property defined in `src/services/gutenbergTypes.ts` as `excludeIds?: (string | number)[]`
   - Used to exclude specific Gutenberg book IDs from search results
   - In `searchGutenbergBooks` function, books are filtered: `books = books.filter(book => !args.excludeIds!.includes(book.id))`
   - Empty array `"excludeIds": []` is used as default to ensure no books are excluded
   - Consider adding validation or documentation for this parameter
