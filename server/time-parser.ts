import * as chrono from 'chrono-node';

export interface ExtractedTask {
  text: string;
  reminderTime: string | null;
  originalTimeText: string | null;
}

export function extractTasksFromText(text: string): ExtractedTask[] {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  
  if (results.length === 0) {
    return [{
      text: text.trim(),
      reminderTime: null,
      originalTimeText: null,
    }];
  }

  const tasks: ExtractedTask[] = [];
  let lastEndIndex = 0;

  for (const result of results) {
    const timeText = result.text;
    const reminderTime = result.start.date().toISOString();
    
    const contextStart = Math.max(0, result.index - 50);
    const contextEnd = Math.min(text.length, result.index + result.text.length + 50);
    
    let taskText = '';
    
    const beforeTime = text.substring(lastEndIndex, result.index).trim();
    const afterTimeEnd = result.index + result.text.length;
    
    let nextResultStart = text.length;
    const currentIdx = results.indexOf(result);
    if (currentIdx < results.length - 1) {
      nextResultStart = results[currentIdx + 1].index;
    }
    
    const afterTime = text.substring(afterTimeEnd, nextResultStart).trim();
    
    const combinedText = `${beforeTime} ${afterTime}`.trim();
    
    const cleanedText = combinedText
      .replace(/^[,.\s]+/, '')
      .replace(/[,.\s]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanedText.length > 0) {
      taskText = cleanedText;
    } else {
      taskText = `Task at ${timeText}`;
    }
    
    tasks.push({
      text: taskText,
      reminderTime,
      originalTimeText: timeText,
    });
    
    lastEndIndex = afterTimeEnd;
  }

  return tasks;
}

export function parseRelativeTime(text: string): Date | null {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  if (results.length > 0) {
    return results[0].start.date();
  }
  return null;
}
