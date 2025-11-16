# QuizView API Integration Update

## Summary
Updated `QuizView.tsx` to fetch and display quiz data dynamically from the backend API instead of using mock data.

## Changes Made

### 1. Updated Type Definitions
```typescript
// New interface to match API response structure
interface QuizQuestion {
  question: string
  options: string[]          // Array of answer options
  correctAnswer: number      // Index of correct answer (0-3)
  explanation?: string       // Optional explanation
}

interface QuizContent {
  questions: QuizQuestion[]
}
```

### 2. Updated State Management
**Before:**
- Used static mock data
- `selectedAnswer: string | null` (stored answer ID like 'A', 'B', 'C', 'D')
- Static `totalQuestions = 20`

**After:**
- Fetches quiz from API using `notesApi.getQuiz(noteId)`
- `selectedAnswer: number | null` (stores answer index 0-3)
- `questions: QuizQuestion[]` state to store parsed quiz data
- Dynamic `getTotalQuestions()` function returns `questions.length`

### 3. Added Quiz Content Parsing
```typescript
useEffect(() => {
  if (quiz && quiz.content) {
    try {
      const content = typeof quiz.content === 'string' 
        ? JSON.parse(quiz.content) 
        : quiz.content
      
      if (content.questions && Array.isArray(content.questions)) {
        setQuestions(content.questions)
      } else {
        setError('Invalid quiz format')
      }
    } catch (err) {
      setError('Failed to parse quiz data')
    }
  }
}, [quiz])
```

### 4. Updated Answer Handling
**Before:**
```typescript
handleAnswerSelect(answerId: string)  // 'A', 'B', 'C', 'D'
answerId === questions[currentQuestion].correctAnswer  // String comparison
```

**After:**
```typescript
handleAnswerSelect(answerIndex: number)  // 0, 1, 2, 3
answerIndex === questions[currentQuestion].correctAnswer  // Number comparison
```

### 5. Updated UI Rendering

#### Answer Options
**Before:**
```typescript
{currentQ.answers.map((answer) => (
  <TouchableOpacity onPress={() => handleAnswerSelect(answer.id)}>
    <Text>{answer.letter}</Text>
    <Text>{answer.text}</Text>
  </TouchableOpacity>
))}
```

**After:**
```typescript
const answerLetters = ['A', 'B', 'C', 'D']

{currentQ.options.map((option, index) => (
  <TouchableOpacity onPress={() => handleAnswerSelect(index)}>
    <Text>{answerLetters[index]}</Text>
    <Text>{option}</Text>
  </TouchableOpacity>
))}
```

#### Pagination Dots
**Before:**
- Static 5 dots, first one always active

**After:**
```typescript
{[...Array(Math.min(5, getTotalQuestions()))].map((_, i) => (
  <View
    style={[
      styles.dot,
      i === Math.floor(currentQuestion / (getTotalQuestions() / 5)) && styles.dotActive,
    ]}
  />
))}
```
- Dynamic dot count (max 5)
- Active dot moves based on progress

#### Summary Cards
**Before:**
```typescript
{correctAnswers}/{totalQuestions}
{totalQuestions - correctAnswers}/{totalQuestions}
```

**After:**
```typescript
{correctAnswers}/{getTotalQuestions()}
{getTotalQuestions() - correctAnswers}/{getTotalQuestions()}
```

### 6. Added Empty State Handling
```typescript
if (questions.length === 0) {
  return (
    <View style={styles.errorContainer}>
      <Feather name="alert-circle" size={48} color="#EF4444" />
      <Text style={styles.errorText}>No questions available</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text>Go Back</Text>
      </TouchableOpacity>
    </View>
  )
}
```

## API Data Flow

### 1. Fetch Quiz
```typescript
const fetchedQuiz = await notesApi.getQuiz(noteId)
// Returns: { id, noteId, content, userId, createdAt, updatedAt }
```

### 2. Generate Quiz (if not found)
```typescript
const generatedQuiz = await notesApi.generateQuiz({ noteId })
// API calls OpenAI to generate questions from note content
```

### 3. Parse Quiz Content
```typescript
const content = JSON.parse(quiz.content)
// Expected structure:
{
  questions: [
    {
      question: "What is...?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 2,  // Index of correct option
      explanation: "Because..."
    },
    // ... more questions
  ]
}
```

## Expected Backend Quiz Structure

The backend should return quiz content in this format:

```json
{
  "id": "quiz-123",
  "noteId": "note-456",
  "content": {
    "questions": [
      {
        "question": "Which AI method includes types such as Supervised, Unsupervised, and Reinforcement Learning?",
        "options": [
          "Computer Vision",
          "Deep Learning Networks",
          "Machine Learning",
          "Natural Language Processing"
        ],
        "correctAnswer": 2,
        "explanation": "Machine Learning is the AI method that encompasses Supervised, Unsupervised, and Reinforcement Learning as its three main types."
      }
    ]
  },
  "userId": "user-789",
  "createdAt": "2025-03-14T10:30:00Z",
  "updatedAt": "2025-03-14T10:30:00Z"
}
```

## Features Preserved

✅ All quiz states still work:
- `initial` - Question with unselected answers
- `correct` - Green feedback with streak counter
- `wrong` - Red feedback with streak broken
- `complete` - Results screen with score

✅ All functionality maintained:
- Answer selection and validation
- Streak tracking
- Score calculation
- Timer tracking
- Retry functionality
- Progress indicators
- Feedback cards

## Benefits

1. **Dynamic Content**: Quiz questions are generated from note content
2. **Flexible Length**: Supports any number of questions (not limited to 20)
3. **Real Data**: Uses actual API instead of mock data
4. **Error Handling**: Graceful handling of missing or invalid quiz data
5. **Type Safety**: Proper TypeScript types matching API structure
6. **Scalable**: Easy to add more quiz features (explanations, difficulty, etc.)

## Testing

To test the updated component:

1. **Existing Quiz**:
   ```typescript
   // Navigate to /notes/{noteId}/quiz
   // Component will fetch existing quiz and display questions
   ```

2. **Generate New Quiz**:
   ```typescript
   // If quiz doesn't exist, it will automatically generate one
   // Shows "Generating quiz..." loading state
   ```

3. **Answer Questions**:
   ```typescript
   // Tap answers to select
   // See immediate feedback (correct/wrong)
   // Continue through all questions
   ```

4. **View Results**:
   ```typescript
   // See final score, time, and statistics
   // Option to retry or create new quiz
   ```

## Error Handling

The component handles multiple error scenarios:

1. **API Fetch Error**: Shows error message with retry button
2. **Quiz Generation Error**: Shows error with option to try again
3. **Parse Error**: Shows "Failed to parse quiz data"
4. **Empty Quiz**: Shows "No questions available"
5. **Invalid Format**: Shows "Invalid quiz format"

## Future Enhancements

Possible improvements:
- Display explanation after answering (use `question.explanation`)
- Save quiz progress locally
- Track best scores in database
- Add difficulty levels
- Support different question types (multiple choice, true/false, etc.)
- Add hints feature
- Implement quiz sharing

## Related Files

- **API**: `/mobile/lib/api/notes.ts` - Quiz API functions
- **Types**: `/mobile/lib/api/types.ts` - Quiz and QuizQuestion types
- **Route**: `/mobile/app/notes/[id]/quiz.tsx` - Quiz screen route
- **Component**: `/mobile/components/notes/QuizView.tsx` - Quiz UI component
