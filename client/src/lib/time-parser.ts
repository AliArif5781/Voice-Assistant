import * as chrono from 'chrono-node';

export interface ExtractedTask {
  text: string;
  reminderTime: string | null;
  originalTimeText: string | null;
}

export function extractTasksFromText(text: string): ExtractedTask[] {
  let cleanedInput = text.trim();
  
  cleanedInput = cleanedInput.replace(/^(fast|okay|ok|hey|hi|hello|um|uh|so|well|alright|right)\s+/i, '');
  
  const results = chrono.parse(cleanedInput, new Date(), { forwardDate: true });
  
  if (results.length === 0) {
    return [{
      text: cleanedInput,
      reminderTime: null,
      originalTimeText: null,
    }];
  }

  const taskSegments: { timeResult: typeof results[0]; startIndex: number; endIndex: number }[] = [];
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const timeEndIndex = result.index + result.text.length;
    
    let segmentStart: number;
    if (i === 0) {
      segmentStart = 0;
    } else {
      segmentStart = taskSegments[i - 1].endIndex;
    }
    
    let segmentEnd: number;
    if (i === results.length - 1) {
      segmentEnd = cleanedInput.length;
    } else {
      const nextTimeStart = results[i + 1].index;
      const textBetween = cleanedInput.substring(timeEndIndex, nextTimeStart);
      const separatorMatch = textBetween.match(/\s+(and|then|also|plus|next|after that)\s+/i);
      
      if (separatorMatch && separatorMatch.index !== undefined) {
        segmentEnd = timeEndIndex + separatorMatch.index;
      } else {
        const sentenceEnd = textBetween.search(/[.!?]\s+/);
        if (sentenceEnd !== -1) {
          segmentEnd = timeEndIndex + sentenceEnd + 1;
        } else {
          segmentEnd = nextTimeStart;
        }
      }
    }
    
    taskSegments.push({
      timeResult: result,
      startIndex: segmentStart,
      endIndex: segmentEnd,
    });
  }
  
  const tasks: ExtractedTask[] = [];
  
  for (const segment of taskSegments) {
    const { timeResult, startIndex, endIndex } = segment;
    const timeText = timeResult.text;
    const parsedDate = timeResult.start.date();
    
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
    const seconds = String(parsedDate.getSeconds()).padStart(2, '0');
    const reminderTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    
    const rawSegment = cleanedInput.substring(startIndex, endIndex);
    
    let taskText = rawSegment
      .replace(new RegExp(escapeRegex(timeText), 'gi'), ' ')
      .replace(/^[\s,.\-:;]+/, '')
      .replace(/[\s,.\-:;]+$/, '')
      .replace(/^(and|then|also|plus|next|after that|at|on|by|today|tomorrow)\s+/gi, '')
      .replace(/\s+(and|then|also|plus)$/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (taskText.length > 0) {
      taskText = taskText.charAt(0).toUpperCase() + taskText.slice(1);
    }
    
    if (taskText.length < 2) {
      taskText = `Task scheduled`;
    }
    
    tasks.push({
      text: taskText,
      reminderTime,
      originalTimeText: timeText,
    });
  }
  
  return deduplicateTasks(tasks);
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deduplicateTasks(tasks: ExtractedTask[]): ExtractedTask[] {
  const seen = new Map<string, ExtractedTask>();
  
  for (const task of tasks) {
    const key = `${task.text.toLowerCase()}-${task.reminderTime}`;
    if (!seen.has(key)) {
      seen.set(key, task);
    }
  }
  
  return Array.from(seen.values());
}
