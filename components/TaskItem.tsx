import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Sparkles, Trash2, Tag, AlertCircle } from 'lucide-react';
import { Task, Priority, SubTask, Category } from '../types';
import { suggestSubtasks } from '../services/geminiService';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSubtasks: (taskId: string, subtasks: SubTask[]) => void;
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    [Priority.High]: 'text-red-400 bg-red-900/30 border-red-800',
    [Priority.Medium]: 'text-amber-400 bg-amber-900/30 border-amber-800',
    [Priority.Low]: 'text-emerald-400 bg-emerald-900/30 border-emerald-800',
  };
  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: Category }) => (
  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
    <Tag size={10} /> {category}
  </span>
);

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdateSubtasks }) => {
  const [expanded, setExpanded] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingAi) return;
    setLoadingAi(true);
    setExpanded(true);
    try {
      const suggestions = await suggestSubtasks(task.title);
      const newSubtasks: SubTask[] = suggestions.map(title => ({
        id: crypto.randomUUID(),
        title,
        completed: false
      }));
      // Merge with existing
      onUpdateSubtasks(task.id, [...task.subtasks, ...newSubtasks]);
    } catch (error) {
      console.error("Failed to suggest subtasks", error);
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    const updated = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateSubtasks(task.id, updated);
  };

  return (
    <div className={`group border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 rounded-xl transition-all duration-200 ${task.completed ? 'opacity-50' : ''}`}>
      <div className="p-4 flex items-start gap-3">
        {/* Toggle Button */}
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 flex-shrink-0 transition-colors ${task.completed ? 'text-brand-500' : 'text-slate-500 hover:text-brand-400'}`}
        >
          {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
           <div className="flex items-start justify-between gap-2">
              <h3 className={`font-medium text-slate-100 truncate pr-2 ${task.completed ? 'line-through text-slate-500' : ''}`}>
                {task.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <CategoryBadge category={task.category} />
                <PriorityBadge priority={task.priority} />
              </div>
           </div>
           
           {task.description && (
             <p className="text-sm text-slate-400 mt-1 line-clamp-2">{task.description}</p>
           )}

           <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                 {task.subtasks.length > 0 && (
                   <>
                    <span className="font-medium text-brand-300">
                      {task.subtasks.filter(t => t.completed).length}/{task.subtasks.length}
                    </span>
                    <span>subtasks</span>
                   </>
                 )}
              </div>
              
              {/* Action Bar (Visible on Hover/Mobile) */}
              <div className="flex items-center gap-1 ml-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {!task.completed && (
                  <button 
                    onClick={handleAiBreakdown}
                    disabled={loadingAi}
                    className="p-1.5 text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                    title="AI Breakdown"
                  >
                    <Sparkles size={16} className={loadingAi ? 'animate-spin' : ''} />
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  className="p-1.5 text-slate-500 hover:bg-slate-700 rounded-lg sm:hidden"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* Expanded Subtasks Area */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 pl-12 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {task.subtasks.length > 0 ? (
            <div className="space-y-1">
              {task.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-2 group/sub">
                  <button 
                    onClick={() => toggleSubtask(st.id)}
                    className={`text-slate-500 hover:text-brand-400 transition-colors`}
                  >
                    {st.completed ? <CheckCircle2 size={14} className="text-brand-500"/> : <Circle size={14} />}
                  </button>
                  <span className={`text-sm ${st.completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic flex items-center gap-2">
               No subtasks. 
               {!task.completed && (
                 <button onClick={handleAiBreakdown} className="text-brand-400 hover:underline flex items-center gap-1">
                   Generate with AI <Sparkles size={10} />
                 </button>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
