import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Task, Priority } from '../types';

interface StatsProps {
  tasks: Task[];
}

const COLORS = {
  High: '#ef4444',   // red-500
  Medium: '#f59e0b', // amber-500
  Low: '#10b981',    // emerald-500
  Completed: '#8b5cf6', // violet-500
  Active: '#64748b'     // slate-500
};

export const Stats: React.FC<StatsProps> = ({ tasks }) => {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        No tasks to visualize yet.
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = totalTasks - completedCount;

  const completionData = [
    { name: 'Completed', value: completedCount },
    { name: 'Active', value: activeCount },
  ];

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === Priority.High && !t.completed).length },
    { name: 'Medium', value: tasks.filter(t => t.priority === Priority.Medium && !t.completed).length },
    { name: 'Low', value: tasks.filter(t => t.priority === Priority.Low && !t.completed).length },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
      {/* Completion Status */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 shadow-sm flex flex-col">
        <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Completion Rate</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell key="cell-completed" fill={COLORS.Completed} />
                <Cell key="cell-active" fill={COLORS.Active} />
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Distribution (Active Tasks) */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 shadow-sm flex flex-col">
         <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Active Priorities</h3>
         <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
               <XAxis type="number" hide />
               <YAxis dataKey="name" type="category" width={50} tick={{fill: '#94a3b8', fontSize: 12}} />
               <Tooltip
                cursor={{fill: '#334155', opacity: 0.2}}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
               />
               <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
               </Bar>
            </BarChart>
          </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};