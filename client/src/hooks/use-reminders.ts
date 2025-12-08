import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ReminderTask {
  id: string;
  text: string;
  scheduledAt: string | null;
  completed: boolean;
}

export function useReminders(tasks: ReminderTask[]) {
  const { toast } = useToast();
  const notifiedRef = useRef<Set<string>>(new Set());
  const permissionRef = useRef<NotificationPermission>('default');
  
  const taskIds = useMemo(() => new Set(tasks.map(t => t.id)), [tasks]);
  
  useEffect(() => {
    const currentNotified = notifiedRef.current;
    Array.from(currentNotified).forEach(id => {
      if (!taskIds.has(id)) {
        currentNotified.delete(id);
      }
    });
  }, [taskIds]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      permissionRef.current = permission;
    } else {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const showNotification = useCallback((task: ReminderTask) => {
    if (notifiedRef.current.has(task.id)) return;
    notifiedRef.current.add(task.id);

    toast({
      title: "Task Reminder",
      description: task.text,
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("Task Reminder", {
          body: task.text,
          icon: '/favicon.ico',
          tag: task.id,
        });
      } catch (err) {
        console.log('Browser notification failed:', err);
      }
    }
  }, [toast]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date().getTime();
      
      for (const task of tasks) {
        if (task.completed || !task.scheduledAt) continue;
        if (notifiedRef.current.has(task.id)) continue;
        
        const taskTime = new Date(task.scheduledAt).getTime();
        const diff = taskTime - now;
        
        if (diff <= 0 && diff > -60000) {
          showNotification(task);
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    
    return () => clearInterval(interval);
  }, [tasks, showNotification]);

  return { requestPermission };
}
