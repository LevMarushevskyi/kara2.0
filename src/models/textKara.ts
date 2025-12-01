// Text-based Kara programming language templates and utilities

export type TextKaraLanguage = 'JavaKara' | 'PythonKara' | 'JavaScriptKara' | 'RubyKara';

// Default code templates for each language
export const defaultTemplates: Record<TextKaraLanguage, string> = {
  JavaKara: `import javakara.JavaKaraProgram;

/*
 * COMMANDS:
 *   kara.move()             kara.turnRight()        kara.turnLeft()
 *   kara.putLeaf()          kara.removeLeaf()
 * SENSORS:
 *   kara.treeFront()        kara.treeLeft()         kara.treeRight()
 *   kara.mushroomFront()    kara.onLeaf()
 */
public class MyProgram extends JavaKaraProgram {
    //
    // you can define your methods here:
    //
    public void myProgram() {
        // put your main program here, for example:
        while (!kara.treeFront()) {
            kara.move();
        }
    }
}
`,

  PythonKara: `from pythonkara import PythonKaraProgram

"""
COMMANDS:
    kara.move()             kara.turn_right()       kara.turn_left()
    kara.put_leaf()         kara.remove_leaf()
SENSORS:
    kara.tree_front()       kara.tree_left()        kara.tree_right()
    kara.mushroom_front()   kara.on_leaf()
"""

class MyProgram(PythonKaraProgram):
    def my_program(self):
        # put your main program here, for example:
        while not kara.tree_front():
            kara.move()
`,

  JavaScriptKara: `// JavaScriptKara Program

/*
 * COMMANDS:
 *   kara.move()             kara.turnRight()        kara.turnLeft()
 *   kara.putLeaf()          kara.removeLeaf()
 * SENSORS:
 *   kara.treeFront()        kara.treeLeft()         kara.treeRight()
 *   kara.mushroomFront()    kara.onLeaf()
 */

function myProgram() {
    // put your main program here, for example:
    while (!kara.treeFront()) {
        kara.move();
    }
}
`,

  RubyKara: `require 'rubykara'

# COMMANDS:
#   kara.move               kara.turn_right         kara.turn_left
#   kara.put_leaf           kara.remove_leaf
# SENSORS:
#   kara.tree_front?        kara.tree_left?         kara.tree_right?
#   kara.mushroom_front?    kara.on_leaf?

class MyProgram < RubyKaraProgram
  def my_program
    # put your main program here, for example:
    while !kara.tree_front?
      kara.move
    end
  end
end
`,
};

// File extensions for each language
export const fileExtensions: Record<TextKaraLanguage, string> = {
  JavaKara: '.java',
  PythonKara: '.py',
  JavaScriptKara: '.js',
  RubyKara: '.rb',
};

// MIME types for each language
export const mimeTypes: Record<TextKaraLanguage, string> = {
  JavaKara: 'text/x-java-source',
  PythonKara: 'text/x-python',
  JavaScriptKara: 'text/javascript',
  RubyKara: 'text/x-ruby',
};

/**
 * Downloads code as a file
 */
export function downloadTextKaraCode(
  code: string,
  language: TextKaraLanguage,
  filename?: string
): void {
  const ext = fileExtensions[language];
  const mime = mimeTypes[language];
  const defaultFilename = `kara-program${ext}`;

  const blob = new Blob([code], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gets the accept string for file input based on language
 */
export function getAcceptString(language: TextKaraLanguage): string {
  const ext = fileExtensions[language];
  return `${ext},.txt`;
}

/**
 * Validates that content looks like code for the given language
 */
export function isValidTextKaraCode(content: string, language: TextKaraLanguage): boolean {
  // Basic validation - just check it's non-empty text
  if (!content || typeof content !== 'string') return false;

  // Could add language-specific validation here in the future
  return content.trim().length > 0;
}

/**
 * Storage key for persisting code
 */
export function getStorageKey(language: TextKaraLanguage): string {
  return `kara-code-${language.toLowerCase()}`;
}

/**
 * Save code to localStorage
 */
export function saveCode(language: TextKaraLanguage, code: string): void {
  try {
    localStorage.setItem(getStorageKey(language), code);
  } catch (e) {
    console.warn('Failed to save code to localStorage:', e);
  }
}

/**
 * Load code from localStorage, or return default template
 */
export function loadCode(language: TextKaraLanguage): string {
  try {
    const saved = localStorage.getItem(getStorageKey(language));
    if (saved !== null) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load code from localStorage:', e);
  }
  return defaultTemplates[language];
}
