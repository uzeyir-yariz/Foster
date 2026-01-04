/**
 * Question Randomizer Utility
 * Shuffles questions and answer options
 */

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffle answer options for a single question
 * Updates the correct answer index accordingly
 */
function shuffleOptions(question) {
  const options = question.seçenekler || question.secenekler || [];
  const correctIndex = question['doğru cevap indeksi'];
  const correctAnswer = options[correctIndex];
  
  // Create array of indices
  const indices = options.map((_, index) => index);
  const shuffledIndices = shuffleArray(indices);
  
  // Shuffle options based on shuffled indices
  const shuffledOptions = shuffledIndices.map(index => options[index]);
  
  // Find new correct answer index
  const newCorrectIndex = shuffledIndices.indexOf(correctIndex);
  
  return {
    ...question,
    seçenekler: shuffledOptions,
    'doğru cevap indeksi': newCorrectIndex,
    originalCorrectIndex: correctIndex,
    correctAnswer // Keep for reference
  };
}

/**
 * Randomize all questions and their options
 */
export function randomizeQuestions(questions) {
  // First, shuffle the questions order
  const shuffledQuestions = shuffleArray(questions);
  
  // Then, shuffle each question's options
  return shuffledQuestions.map((question, index) => ({
    ...shuffleOptions(question),
    displayOrder: index + 1 // For UI display
  }));
}

/**
 * Get option letter (A, B, C, D, E)
 */
export function getOptionLetter(index) {
  return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
}

/**
 * Extract option letter from option text (e.g., "A) Answer" -> "A")
 */
export function extractOptionLetter(optionText) {
  const match = optionText.match(/^([A-E])\)/);
  return match ? match[1] : null;
}
