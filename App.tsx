import React, { useState, useEffect, useRef } from 'react';
import { Plus, Layout, ListFilter, Sparkles, BrainCircuit, X, Search, Calendar, CheckSquare, Loader2 } from 'lucide-react';
import { Task, Category, Priority, FilterType, SubTask } from './types';
import { generateActionPlan, suggestPriority } from './services/geminiService';
import { TaskItem } from './components/TaskItem';
import { Stats } from './components/Stats';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('mindflow-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false); // Toggle between simple add vs AI plan
  
  // Input State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>(Category.Work);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.Medium);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem('mindflow-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Task) => {
    setTasks(prev => [task, ...prev]);
  };

  const handleSimpleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Optional: Quick AI priority check if not explicitly set by user interaction (simplified here to just creating)
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      priority: newTaskPriority,
      category: newTaskCategory,
      completed: false,
      createdAt: Date.now(),
      subtasks: []
    };
    addTask(task);
    setNewTaskTitle('');
    setIsAddModalOpen(false);
  };

  const handleAiPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const plan = await generateActionPlan(aiPrompt);
      const newTasks: Task[] = plan.tasks.map(t => ({
        id: crypto.randomUUID(),
        title: t.title,
        description: t.description,
        priority: t.priority,
        category: t.category,
        completed: false,
        createdAt: Date.now(),
        subtasks: t.subtasks ? t.subtasks.map(st => ({ id: crypto.randomUUID(), title: st, completed: false })) : []
      }));
      
      setTasks(prev => [...newTasks, ...prev]); // Add all generated tasks
      setAiPrompt('');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("Could not generate plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateSubtasks = (taskId: string, subtasks: SubTask[]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks } : t));
  };

  // Filter Logic
  const filteredTasks = tasks.filter(t => {
    const matchesFilter = 
      filter === 'all' ? true : 
      filter === 'active' ? !t.completed : 
      t.completed;
    
    const matchesCategory = activeCategory === 'All' ? true : t.category === activeCategory;
    
    return matchesFilter && matchesCategory;
  });

  // Calculate quick stats for sidebar
  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col md:h-screen sticky top-0 z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
            <BrainCircuit size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            MindFlow
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Views</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${filter === 'all' ? 'bg-brand-500/10 text-brand-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2"><Layout size={16}/> All Tasks</span>
                <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{tasks.length}</span>
              </button>
              <button 
                 onClick={() => setFilter('active')}
                 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${filter === 'active' ? 'bg-brand-500/10 text-brand-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2"><CheckSquare size={16}/> Active</span>
                <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{pendingCount}</span>
              </button>
            </div>
          </div>

          <div>
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Categories</h3>
             <div className="space-y-1">
               {['All', ...Object.values(Category)].map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveCategory(cat as Category | 'All')}
                   className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeCategory === cat ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:bg-slate-800/50'}`}
                 >
                   <div className={`w-2 h-2 rounded-full ${cat === 'All' ? 'bg-slate-500' : 'bg-brand-500'}`} />
                   {cat}
                 </button>
               ))}
             </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => { setIsAddModalOpen(true); setIsAiMode(true); }}
            className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-medium shadow-lg shadow-brand-900/50 transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles size={18} className="text-brand-200 group-hover:text-white transition-colors" />
            AI Plan Goal
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 md:px-8">
           <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
             {activeCategory === 'All' ? 'Overview' : activeCategory}
             {filter !== 'all' && <span className="text-slate-500 font-normal">/ {filter}</span>}
           </h2>
           <button 
              onClick={() => { setIsAddModalOpen(true); setIsAiMode(false); }}
              className="md:hidden w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white"
           >
             <Plus size={18} />
           </button>
           <div className="hidden md:block text-sm text-slate-500">
             {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
           </div>
        </header>

        {/* Scrollable Task Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-24 md:pb-8">
          
          {/* Stats Section */}
          <section>
            <Stats tasks={tasks} />
          </section>

          {/* Task List */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-slate-100 font-medium">Tasks ({filteredTasks.length})</h3>
                <div className="flex gap-2">
                   {/* Sort or Filter Actions could go here */}
                </div>
             </div>

             {filteredTasks.length === 0 ? (
               <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                 <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                   <ListFilter size={24} />
                 </div>
                 <h3 className="text-slate-300 font-medium mb-1">No tasks found</h3>
                 <p className="text-slate-500 text-sm max-w-xs mx-auto">
                   Get started by creating a new task or asking AI to plan a goal for you.
                 </p>
                 <button 
                    onClick={() => { setIsAddModalOpen(true); setIsAiMode(false); }}
                    className="mt-4 text-brand-400 hover:text-brand-300 text-sm font-medium"
                 >
                   + Add Task
                 </button>
               </div>
             ) : (
               <div className="grid gap-3">
                 {filteredTasks.map(task => (
                   <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={toggleTask} 
                      onDelete={deleteTask}
                      onUpdateSubtasks={updateSubtasks}
                   />
                 ))}
               </div>
             )}
          </section>
        </div>

        {/* Floating Action Button (Mobile) */}
        <button
           onClick={() => { setIsAddModalOpen(true); setIsAiMode(false); }}
           className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-xl shadow-brand-900/50 flex items-center justify-center z-20 hover:scale-105 transition-transform"
        >
          <Plus size={24} />
        </button>
      </main>

      {/* Add Task / AI Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header Tabs */}
            <div className="flex border-b border-slate-800">
              <button 
                onClick={() => setIsAiMode(false)}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${!isAiMode ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                Simple Task
              </button>
              <button 
                onClick={() => setIsAiMode(true)}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors flex items-center justify-center gap-2 ${isAiMode ? 'bg-brand-900/20 text-brand-300 border-b-2 border-brand-500' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                <Sparkles size={14} /> AI Planner
              </button>
            </div>

            <div className="p-6">
               {isAiMode ? (
                 <form onSubmit={handleAiPlan} className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-sm text-slate-400 font-medium">What is your main goal?</label>
                     <textarea
                       value={aiPrompt}
                       onChange={(e) => setAiPrompt(e.target.value)}
                       placeholder="e.g., Plan a 3-day trip to Tokyo, or Organize a marketing campaign launch..."
                       className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-h-[120px] resize-none"
                       autoFocus
                     />
                     <p className="text-xs text-slate-500">
                       AI will break this down into prioritized tasks with sub-steps.
                     </p>
                   </div>
                   <div className="flex justify-end gap-3 pt-2">
                     <button
                       type="button"
                       onClick={() => setIsAddModalOpen(false)}
                       className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium"
                     >
                       Cancel
                     </button>
                     <button
                       type="submit"
                       disabled={isGenerating || !aiPrompt.trim()}
                       className="px-6 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-brand-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                       {isGenerating ? 'Planning...' : 'Generate Plan'}
                     </button>
                   </div>
                 </form>
               ) : (
                 <form onSubmit={handleSimpleAdd} className="space-y-4">
                   <div className="space-y-3">
                     <div>
                       <label className="block text-xs text-slate-500 uppercase font-bold mb-1.5">Task Title</label>
                       <input
                         type="text"
                         value={newTaskTitle}
                         onChange={(e) => setNewTaskTitle(e.target.value)}
                         placeholder="What needs to be done?"
                         className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                         autoFocus
                       />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs text-slate-500 uppercase font-bold mb-1.5">Category</label>
                           <select 
                             value={newTaskCategory}
                             onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                           >
                             {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs text-slate-500 uppercase font-bold mb-1.5">Priority</label>
                           <select 
                             value={newTaskPriority}
                             onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                           >
                             {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                        </div>
                     </div>
                   </div>

                   <div className="flex justify-end gap-3 pt-4">
                     <button
                       type="button"
                       onClick={() => setIsAddModalOpen(false)}
                       className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium"
                     >
                       Cancel
                     </button>
                     <button
                       type="submit"
                       disabled={!newTaskTitle.trim()}
                       className="px-6 py-2 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-sm font-bold shadow transition-colors disabled:opacity-50"
                     >
                       Add Task
                     </button>
                   </div>
                 </form>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;