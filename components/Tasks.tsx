import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  X,
  Filter
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { toPersianDigits, getTodayPersianDate } from '../constants';
import CustomSelect from './CustomSelect';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-['Vazirmatn']">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

const Tasks: React.FC = () => {
  const { tasks, projects, addTask, deleteTask, toggleTaskStatus } = useData();
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: getTodayPersianDate()
  });

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === newTask.projectId);
    addTask({
      title: newTask.title,
      projectId: newTask.projectId,
      projectName: proj?.title || '',
      priority: newTask.priority,
      status: 'todo',
      dueDate: newTask.dueDate
    });

    setIsAddModalOpen(false);
    setNewTask({
      title: '',
      projectId: projects[0]?.id || '',
      priority: 'medium',
      dueDate: getTodayPersianDate()
    });
  };

  const filteredTasks = tasks
    .filter((t) => {
      const matchesProject = filterProject === 'all' || t.projectId === filterProject;
      const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
      return matchesProject && matchesPriority;
    })
    .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));

  const columns = [
    { id: 'todo', label: 'برای انجام', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'doing', label: 'در حال انجام', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { id: 'done', label: 'انجام شده', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
  ];

  const projectFilterOptions = [
    { value: 'all', label: 'همه پروژه‌ها' },
    ...projects.map((p) => ({ value: p.id, label: p.title, sublabel: p.clientName }))
  ];

  const priorityFilterOptions = [
    { value: 'all', label: 'همه اولویت‌ها' },
    { value: 'high', label: 'فوری', dotColorClass: 'bg-rose-500' },
    { value: 'medium', label: 'متوسط', dotColorClass: 'bg-amber-500' },
    { value: 'low', label: 'عادی', dotColorClass: 'bg-slate-400' }
  ];

  const taskProjectOptions = projects.map((p) => ({
    value: p.id,
    label: p.title,
    sublabel: p.clientName
  }));

  const taskPriorityOptions = [
    { value: 'high', label: 'فوری', dotColorClass: 'bg-rose-500' },
    { value: 'medium', label: 'متوسط', dotColorClass: 'bg-amber-500' },
    { value: 'low', label: 'عادی', dotColorClass: 'bg-slate-400' }
  ];

  return (
    <div className="space-y-6 font-['Vazirmatn']">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <CheckSquare className="text-indigo-600" size={26} />
            مدیریت تسک‌ها و کارهای پروژه
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            بورد کانبان برای سازماندهی وظایف توسعه، باگ‌ها و مراحل تحویل (جدیدترین‌ها در بالا)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus size={16} />
          افزودن تسک جدید
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Filter size={14} className="text-indigo-600" /> فیلتر پروژه:
        </span>
        <div className="w-56">
          <CustomSelect
            value={filterProject}
            onChange={setFilterProject}
            options={projectFilterOptions}
            searchable
          />
        </div>

        <span className="text-xs font-bold text-slate-500 mr-2">اولویت:</span>
        <div className="w-44">
          <CustomSelect
            value={filterPriority}
            onChange={setFilterPriority}
            options={priorityFilterOptions}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-50/80 rounded-3xl p-4 sm:p-5 border border-slate-200/80 space-y-4 flex flex-col justify-between min-h-[430px]"
            >
              <div>
                <div className={`p-3 rounded-2xl border ${col.color} flex justify-between items-center mb-4`}>
                  <h4 className="font-black text-xs">{col.label}</h4>
                  <span className="text-xs font-black bg-white/90 px-2.5 py-0.5 rounded-lg tabular-nums">
                    {toPersianDigits(colTasks.length)}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 p-6 text-center">موردی در این ستون ثبت نشده است</p>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all space-y-2.5 group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              task.priority === 'high'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : task.priority === 'medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {task.priority === 'high' ? 'فوری' : task.priority === 'medium' ? 'متوسط' : 'عادی'}
                          </span>

                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف تسک"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <h5 className="font-bold text-slate-800 text-xs leading-relaxed">{task.title}</h5>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                          <span className="font-bold text-slate-600 truncate max-w-[150px]">
                            {task.projectName || 'عمومی'}
                          </span>
                          <span className="tabular-nums font-bold">
                            {toPersianDigits(task.dueDate || task.deadline || '—')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task.id)}
                          className="w-full py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-[11px] font-bold rounded-xl transition-colors text-center cursor-pointer"
                        >
                          انتقال به مرحله بعد ⟵
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="w-full py-2.5 bg-white hover:bg-indigo-50 border border-dashed border-slate-300 text-slate-600 hover:text-indigo-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> افزودن تسک
              </button>
            </div>
          );
        })}
      </div>

      {/* ADD TASK MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="افزودن تسک جدید">
        <form className="space-y-4" onSubmit={handleAddTaskSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">عنوان تسک یا کار *</label>
            <input
              type="text"
              required
              placeholder="مثلاً: اصلاح کوئری‌های پرفرمنس و ساخت ایندکس"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">پروژه مربوطه *</label>
            <CustomSelect
              value={newTask.projectId}
              onChange={(val) => setNewTask({ ...newTask, projectId: val })}
              options={taskProjectOptions}
              searchable
              placeholder="انتخاب پروژه..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اولویت</label>
              <CustomSelect
                value={newTask.priority}
                onChange={(val) => setNewTask({ ...newTask, priority: val as any })}
                options={taskPriorityOptions}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">موعد انجام</label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={newTask.dueDate}
                onChange={(d) => setNewTask({ ...newTask, dueDate: d?.format?.('YYYY/MM/DD') || '' })}
                inputClass="rmdp-input"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
            >
              افزودن به بورد
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
