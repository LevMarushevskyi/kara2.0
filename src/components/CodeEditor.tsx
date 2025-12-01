import { Card } from '@/components/ui/card';
import { useRef, useEffect, useState, useCallback } from 'react';

type Language = 'JavaKara' | 'PythonKara' | 'JavaScriptKara' | 'RubyKara';

interface CodeEditorProps {
  code: string;
  language: Language;
  onChange: (code: string) => void;
}

// Auto-closing bracket pairs
const BRACKET_PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
};

const OPENING_BRACKETS = ['(', '[', '{'];
const CLOSING_BRACKETS = [')', ']', '}'];
const ALL_BRACKETS = [...OPENING_BRACKETS, ...CLOSING_BRACKETS];

// Find matching bracket position
function findMatchingBracket(code: string, position: number): number | null {
  const char = code[position];
  if (!ALL_BRACKETS.includes(char)) return null;

  const isOpening = OPENING_BRACKETS.includes(char);
  const matchChar = isOpening
    ? BRACKET_PAIRS[char]
    : Object.entries(BRACKET_PAIRS).find(([, v]) => v === char)?.[0];

  if (!matchChar) return null;

  let depth = 1;
  const direction = isOpening ? 1 : -1;
  let i = position + direction;

  while (i >= 0 && i < code.length && depth > 0) {
    if (code[i] === char) depth++;
    else if (code[i] === matchChar) depth--;
    if (depth === 0) return i;
    i += direction;
  }

  return null;
}

// Convert position to line and column
function positionToLineCol(code: string, position: number): { line: number; col: number } {
  const lines = code.substring(0, position).split('\n');
  return {
    line: lines.length - 1,
    col: lines[lines.length - 1].length,
  };
}

// Syntax highlighting patterns for different languages
const syntaxPatterns: Record<Language, { keywords: RegExp; comments: RegExp; strings: RegExp; methods: RegExp }> = {
  JavaKara: {
    keywords: /\b(import|public|class|extends|void|while|if|else|for|return|new|private|protected|static|final|boolean|int|String|true|false|null)\b/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    strings: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    methods: /\b(kara\.move|kara\.turnRight|kara\.turnLeft|kara\.putLeaf|kara\.removeLeaf|kara\.treeFront|kara\.treeLeft|kara\.treeRight|kara\.mushroomFront|kara\.onLeaf)\b/g,
  },
  PythonKara: {
    keywords: /\b(import|from|class|def|while|if|elif|else|for|return|True|False|None|and|or|not|in|is|pass|break|continue|self)\b/g,
    comments: /(#.*$|'''[\s\S]*?'''|"""[\s\S]*?""")/gm,
    strings: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    methods: /\b(kara\.move|kara\.turn_right|kara\.turn_left|kara\.put_leaf|kara\.remove_leaf|kara\.tree_front|kara\.tree_left|kara\.tree_right|kara\.mushroom_front|kara\.on_leaf)\b/g,
  },
  JavaScriptKara: {
    keywords: /\b(import|export|from|class|extends|function|const|let|var|while|if|else|for|return|new|true|false|null|undefined|async|await|this)\b/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    strings: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
    methods: /\b(kara\.move|kara\.turnRight|kara\.turnLeft|kara\.putLeaf|kara\.removeLeaf|kara\.treeFront|kara\.treeLeft|kara\.treeRight|kara\.mushroomFront|kara\.onLeaf)\b/g,
  },
  RubyKara: {
    keywords: /\b(require|class|def|end|while|if|elsif|else|unless|for|return|true|false|nil|do|and|or|not|in|self|module|attr_accessor|attr_reader)\b/g,
    comments: /(#.*$|=begin[\s\S]*?=end)/gm,
    strings: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    methods: /\b(kara\.move|kara\.turn_right|kara\.turn_left|kara\.put_leaf|kara\.remove_leaf|kara\.tree_front\?|kara\.tree_left\?|kara\.tree_right\?|kara\.mushroom_front\?|kara\.on_leaf\?)\b/g,
  },
};

// Apply syntax highlighting to a line of code
function highlightLine(
  line: string,
  language: Language,
  lineIndex: number,
  highlightedBrackets?: { line: number; col: number }[]
): React.ReactNode[] {
  const patterns = syntaxPatterns[language];
  const result: React.ReactNode[] = [];

  // Tokenize the line
  interface Token {
    type: 'keyword' | 'comment' | 'string' | 'method' | 'text' | 'bracket-highlight';
    value: string;
    start: number;
    end: number;
  }

  const tokens: Token[] = [];

  // Add highlighted brackets as special tokens
  if (highlightedBrackets) {
    for (const bracket of highlightedBrackets) {
      if (bracket.line === lineIndex) {
        tokens.push({
          type: 'bracket-highlight',
          value: line[bracket.col] || '',
          start: bracket.col,
          end: bracket.col + 1,
        });
      }
    }
  }

  // Find all matches for each pattern type
  const findMatches = (regex: RegExp, type: Token['type']) => {
    let match;
    const regexCopy = new RegExp(regex.source, regex.flags);
    while ((match = regexCopy.exec(line)) !== null) {
      tokens.push({
        type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  };

  // Comments have highest priority (they can contain anything)
  findMatches(patterns.comments, 'comment');
  findMatches(patterns.strings, 'string');
  findMatches(patterns.methods, 'method');
  findMatches(patterns.keywords, 'keyword');

  // Sort by position and filter overlapping (earlier tokens win)
  tokens.sort((a, b) => a.start - b.start);

  const filteredTokens: Token[] = [];
  let lastEnd = 0;

  for (const token of tokens) {
    // Check if this token overlaps with any existing token
    const overlaps = filteredTokens.some(
      (t) => token.start < t.end && token.end > t.start
    );
    if (!overlaps && token.start >= lastEnd) {
      filteredTokens.push(token);
      lastEnd = token.end;
    }
  }

  // Re-sort after filtering
  filteredTokens.sort((a, b) => a.start - b.start);

  // Build the result
  let currentIndex = 0;

  for (const token of filteredTokens) {
    // Add text before this token
    if (token.start > currentIndex) {
      result.push(
        <span key={`text-${currentIndex}`}>
          {line.slice(currentIndex, token.start)}
        </span>
      );
    }

    // Add the token with appropriate styling
    const className = {
      keyword: 'text-blue-600 dark:text-blue-400',
      comment: 'text-green-600 dark:text-green-400',
      string: 'text-amber-600 dark:text-amber-400',
      method: 'text-purple-600 dark:text-purple-400',
      'bracket-highlight': 'bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white rounded-sm',
      text: '',
    }[token.type];

    result.push(
      <span key={`${token.type}-${token.start}`} className={className}>
        {token.value}
      </span>
    );

    currentIndex = token.end;
  }

  // Add remaining text
  if (currentIndex < line.length) {
    result.push(
      <span key={`text-${currentIndex}`}>
        {line.slice(currentIndex)}
      </span>
    );
  }

  // If empty line, add a space to maintain height
  if (result.length === 0) {
    result.push(<span key="empty">&nbsp;</span>);
  }

  return result;
}

// History entry for undo/redo
interface HistoryEntry {
  code: string;
  cursorPosition: number;
}

const MAX_HISTORY_SIZE = 100;

const CodeEditor = ({ code, language, onChange }: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [highlightedBrackets, setHighlightedBrackets] = useState<{ line: number; col: number }[]>([]);

  // Undo/Redo history
  const historyRef = useRef<HistoryEntry[]>([{ code, cursorPosition: 0 }]);
  const historyIndexRef = useRef<number>(0);
  const isUndoRedoRef = useRef<boolean>(false);

  // Add to history when code changes (but not during undo/redo)
  const addToHistory = useCallback((newCode: string, newCursorPosition: number) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    // Remove any future history if we're not at the end
    if (currentIndex < history.length - 1) {
      history.splice(currentIndex + 1);
    }

    // Add new entry
    history.push({ code: newCode, cursorPosition: newCursorPosition });

    // Limit history size
    if (history.length > MAX_HISTORY_SIZE) {
      history.shift();
    } else {
      historyIndexRef.current = history.length - 1;
    }
  }, []);

  // Undo function
  const undo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex > 0) {
      isUndoRedoRef.current = true;
      historyIndexRef.current = currentIndex - 1;
      const entry = history[currentIndex - 1];
      onChange(entry.code);
      setCursorPosition(entry.cursorPosition);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = entry.cursorPosition;
          textareaRef.current.selectionEnd = entry.cursorPosition;
        }
      }, 0);
    }
  }, [onChange]);

  // Redo function
  const redo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      historyIndexRef.current = currentIndex + 1;
      const entry = history[currentIndex + 1];
      onChange(entry.code);
      setCursorPosition(entry.cursorPosition);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = entry.cursorPosition;
          textareaRef.current.selectionEnd = entry.cursorPosition;
        }
      }, 0);
    }
  }, [onChange]);

  // Update lines when code changes
  useEffect(() => {
    const newLines = code.split('\n');
    setLines(newLines);
  }, [code]);

  // Update bracket highlighting when cursor position changes
  useEffect(() => {
    const brackets: { line: number; col: number }[] = [];

    // Check character at cursor and before cursor
    const positions = [cursorPosition, cursorPosition - 1];

    for (const pos of positions) {
      if (pos >= 0 && pos < code.length && ALL_BRACKETS.includes(code[pos])) {
        const matchPos = findMatchingBracket(code, pos);
        if (matchPos !== null) {
          brackets.push(positionToLineCol(code, pos));
          brackets.push(positionToLineCol(code, matchPos));
          break; // Only highlight one pair
        }
      }
    }

    setHighlightedBrackets(brackets);
  }, [cursorPosition, code]);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current && lineNumbersRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Track cursor position
  const handleSelect = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, []);

  // Handle key events for auto-closing brackets, tab, and undo/redo
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // Undo: Ctrl/Cmd + Z
    if (modKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }

    // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
    if ((modKey && e.key === 'y') || (modKey && e.key === 'z' && e.shiftKey)) {
      e.preventDefault();
      redo();
      return;
    }

    // Tab key - insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      const newPos = start + 4;
      onChange(newCode);
      addToHistory(newCode, newPos);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newPos;
        setCursorPosition(newPos);
      }, 0);
      return;
    }

    // Auto-close brackets
    if (BRACKET_PAIRS[e.key]) {
      const closingChar = BRACKET_PAIRS[e.key];
      const isQuote = ['"', "'", '`'].includes(e.key);

      // For quotes, check if we're already inside the same quote
      if (isQuote) {
        // If the next character is the same quote, just move past it
        if (code[start] === e.key) {
          e.preventDefault();
          const newPos = start + 1;
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = newPos;
            setCursorPosition(newPos);
          }, 0);
          return;
        }
      }

      // Insert the pair
      e.preventDefault();
      const newCode = code.substring(0, start) + e.key + closingChar + code.substring(end);
      const newPos = start + 1;
      onChange(newCode);
      addToHistory(newCode, newPos);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newPos;
        setCursorPosition(newPos);
      }, 0);
      return;
    }

    // Skip over closing bracket if it's already there
    if (CLOSING_BRACKETS.includes(e.key) && code[start] === e.key) {
      e.preventDefault();
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        setCursorPosition(start + 1);
      }, 0);
      return;
    }

    // Backspace - delete both brackets if cursor is between them
    if (e.key === 'Backspace' && start === end && start > 0) {
      const charBefore = code[start - 1];
      const charAfter = code[start];
      if (BRACKET_PAIRS[charBefore] === charAfter) {
        e.preventDefault();
        const newCode = code.substring(0, start - 1) + code.substring(start + 1);
        const newPos = start - 1;
        onChange(newCode);
        addToHistory(newCode, newPos);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = newPos;
          setCursorPosition(newPos);
        }, 0);
        return;
      }
    }

    // Enter key - auto-indent
    if (e.key === 'Enter') {
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const currentLine = code.substring(lineStart, start);
      const indent = currentLine.match(/^(\s*)/)?.[1] || '';

      // Check if cursor is between braces
      const charBefore = code[start - 1];
      const charAfter = code[start];
      if (charBefore === '{' && charAfter === '}') {
        e.preventDefault();
        const newCode =
          code.substring(0, start) +
          '\n' + indent + '    ' +
          '\n' + indent +
          code.substring(start);
        const newPos = start + 1 + indent.length + 4;
        onChange(newCode);
        addToHistory(newCode, newPos);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = newPos;
          setCursorPosition(newPos);
        }, 0);
        return;
      }

      // Regular enter - maintain indent
      e.preventDefault();
      const newCode = code.substring(0, start) + '\n' + indent + code.substring(end);
      const newPos = start + 1 + indent.length;
      onChange(newCode);
      addToHistory(newCode, newPos);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newPos;
        setCursorPosition(newPos);
      }, 0);
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900 border-2">
      <div className="flex-1 flex overflow-hidden font-mono text-sm">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 overflow-hidden select-none"
          style={{ width: '50px' }}
        >
          <div className="py-2 px-2 text-right">
            {lines.map((_, index) => (
              <div
                key={index}
                className="text-gray-500 dark:text-gray-400 leading-6"
                style={{ height: '24px' }}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Syntax highlighted overlay */}
          <div
            ref={highlightRef}
            className="absolute inset-0 py-2 px-3 overflow-auto pointer-events-none whitespace-pre"
            style={{
              lineHeight: '24px',
              color: 'transparent',
            }}
            aria-hidden="true"
          >
            {lines.map((line, index) => (
              <div key={index} style={{ height: '24px' }} className="text-black dark:text-white">
                {highlightLine(line, language, index, highlightedBrackets)}
              </div>
            ))}
          </div>

          {/* Textarea for editing */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              const newCode = e.target.value;
              const newCursorPos = e.target.selectionStart;
              onChange(newCode);
              setCursorPosition(newCursorPos);
              addToHistory(newCode, newCursorPos);
            }}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onClick={handleSelect}
            className="absolute inset-0 w-full h-full py-2 px-3 bg-transparent text-transparent caret-black dark:caret-white resize-none outline-none whitespace-pre overflow-auto z-10"
            style={{
              lineHeight: '24px',
              caretColor: 'black',
              WebkitTextFillColor: 'transparent',
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      </div>
    </Card>
  );
};

export default CodeEditor;
