
import { useState, useEffect } from "react";
import { Plus, Check, Trash2, Clock, Flag, Search, Edit, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface TaskUser {
  id: number;
  name: string;
  avatar: string;
}

interface TodoItem {
  id: number;
  text: string;
  description?: string;
  completed: boolean;
  timestamp: number;
  status: 'done' | 'in-progress' | 'on-review' | 'in-queue';
  priority: 'low' | 'medium' | 'high';
  designer?: TaskUser;
  lastUpdate: number;
}

const sampleUsers: TaskUser[] = [
  { id: 1, name: "Alana Zelenski", avatar: "https://randomuser.me/api/portraits/women/32.jpg" },
  { id: 2, name: "David Cooper", avatar: "https://randomuser.me/api/portraits/men/42.jpg" },
  { id: 3, name: "Jarjit Singh", avatar: "https://randomuser.me/api/portraits/men/72.jpg" },
  { id: 4, name: "Franklin Gothic", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: 5, name: "Norman Nolan", avatar: "https://randomuser.me/api/portraits/men/52.jpg" },
];

const ToDoPanel = () => {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const savedTodos = localStorage.getItem('cyrusTodos');
    return savedTodos ? JSON.parse(savedTodos) : [
      {
        id: 1,
        text: "Landing Page Design",
        description: "Create a modern landing page for the new product",
        completed: true,
        timestamp: Date.now() - 86400000,
        status: 'done',
        priority: 'high',
        designer: sampleUsers[0],
        lastUpdate: Date.now() - 86400000
      },
      {
        id: 2,
        text: "Mobile App Design",
        description: "Design UI for the mobile application",
        completed: false,
        timestamp: Date.now() - 172800000,
        status: 'on-review',
        priority: 'high',
        designer: sampleUsers[1],
        lastUpdate: Date.now() - 3600000
      },
      {
        id: 3,
        text: "Custom Font Design",
        description: "Create a custom font for branding",
        completed: false,
        timestamp: Date.now() - 259200000,
        status: 'in-progress',
        priority: 'medium',
        designer: sampleUsers[3],
        lastUpdate: Date.now() - 86400000
      },
      {
        id: 4,
        text: "Logo Design",
        description: "Design a new logo for the brand",
        completed: false,
        timestamp: Date.now() - 345600000,
        status: 'on-review',
        priority: 'high',
        designer: sampleUsers[4],
        lastUpdate: Date.now() - 7200000
      }
    ];
  });
  
  const [newTodo, setNewTodo] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [filter, setFilter] = useState<'all' | 'done' | 'in-progress' | 'on-review' | 'in-queue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<TodoItem | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<TaskUser | null>(null);
  
  useEffect(() => {
    localStorage.setItem('cyrusTodos', JSON.stringify(todos));
  }, [todos]);
  
  const addTodo = () => {
    if (newTodo.trim()) {
      const newItem: TodoItem = {
        id: Date.now(),
        text: newTodo.trim(),
        description: newDescription.trim(),
        completed: false,
        timestamp: Date.now(),
        status: 'in-queue',
        priority: 'medium',
        designer: selectedDesigner || undefined,
        lastUpdate: Date.now()
      };
      
      setTodos([...todos, newItem]);
      setNewTodo("");
      setNewDescription("");
      setSelectedDesigner(null);
      setShowTaskModal(false);
      toast.success("Task added");
    }
  };
  
  const updateTodoStatus = (id: number, status: 'done' | 'in-progress' | 'on-review' | 'in-queue') => {
    setTodos(todos.map(todo => 
      todo.id === id ? { 
        ...todo, 
        status,
        completed: status === 'done',
        lastUpdate: Date.now()
      } : todo
    ));
  };
  
  const updateTodoPriority = (id: number, priority: 'low' | 'medium' | 'high') => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, priority, lastUpdate: Date.now() } : todo
    ));
  };
  
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
    toast.info("Task removed");
  };

  const editTask = (task: TodoItem) => {
    setCurrentTask(task);
    setNewTodo(task.text);
    setNewDescription(task.description || "");
    setSelectedDesigner(task.designer || null);
    setShowTaskModal(true);
  };
  
  const updateTask = () => {
    if (!currentTask) return;
    
    setTodos(todos.map(todo => 
      todo.id === currentTask.id ? {
        ...todo,
        text: newTodo.trim(),
        description: newDescription.trim(),
        designer: selectedDesigner || undefined,
        lastUpdate: Date.now()
      } : todo
    ));
    
    setShowTaskModal(false);
    setCurrentTask(null);
    setNewTodo("");
    setNewDescription("");
    setSelectedDesigner(null);
    toast.success("Task updated");
  };
  
  const filteredTodos = todos.filter(todo => {
    // Apply status filter
    if (filter !== 'all' && todo.status !== filter) return false;
    
    // Apply priority filter
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;
    
    // Apply search query
    if (searchQuery && !todo.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });
  
  // Count tasks by status
  const taskCounts = {
    done: todos.filter(t => t.status === 'done').length,
    inProgress: todos.filter(t => t.status === 'in-progress').length,
    inQueue: todos.filter(t => t.status === 'in-queue').length,
    onReview: todos.filter(t => t.status === 'on-review').length,
  };
  
  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) {
      return days === 1 ? "Yesterday" : `${days} days ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      return "Just now";
    }
  };
  
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-cyrus-dark">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-cyrus-gold">Task Manager</h2>
          <button 
            className="bg-cyrus-blue hover:bg-opacity-80 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-md"
            onClick={() => {
              setCurrentTask(null);
              setNewTodo("");
              setNewDescription("");
              setSelectedDesigner(null);
              setShowTaskModal(true);
            }}
          >
            <Plus size={18} />
            <span className="ml-1">Create New Task</span>
          </button>
        </div>
        
        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-cyrus-dark-light p-4 rounded-lg shadow border-l-4 border-pink-300">
            <div className="flex justify-between">
              <div>
                <h3 className="text-gray-400 text-sm">Task Left</h3>
                <p className="text-3xl font-bold text-white">{todos.filter(t => !t.completed).length}</p>
              </div>
              <div className="bg-cyrus-dark-lighter p-2 rounded-lg">
                <Clock className="text-pink-500" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-cyrus-dark-light p-4 rounded-lg shadow border-l-4 border-green-300">
            <div className="flex justify-between">
              <div>
                <h3 className="text-gray-400 text-sm">Done</h3>
                <p className="text-3xl font-bold text-white">{taskCounts.done}</p>
              </div>
              <div className="bg-cyrus-dark-lighter p-2 rounded-lg">
                <Check className="text-green-500" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-cyrus-dark-light p-4 rounded-lg shadow border-l-4 border-purple-300">
            <div className="flex justify-between">
              <div>
                <h3 className="text-gray-400 text-sm">In Progress</h3>
                <p className="text-3xl font-bold text-white">{taskCounts.inProgress}</p>
              </div>
              <div className="bg-cyrus-dark-lighter p-2 rounded-lg">
                <Edit className="text-purple-500" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-cyrus-dark-light p-4 rounded-lg shadow border-l-4 border-orange-300">
            <div className="flex justify-between">
              <div>
                <h3 className="text-gray-400 text-sm">In Queue</h3>
                <p className="text-3xl font-bold text-white">{taskCounts.inQueue}</p>
              </div>
              <div className="bg-cyrus-dark-lighter p-2 rounded-lg">
                <Flag className="text-orange-500" size={24} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-cyrus-dark-light rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:space-x-4">
            <div className="relative flex-1 mb-4 md:mb-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                className="bg-cyrus-dark-lighter border border-cyrus-dark-lightest text-white text-sm rounded-lg focus:ring-cyrus-blue focus:border-cyrus-blue block w-full pl-10 p-2.5"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <select
                className="bg-cyrus-dark-lighter border border-cyrus-dark-lightest text-white text-sm rounded-lg focus:ring-cyrus-blue focus:border-cyrus-blue p-2.5"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="done">Done</option>
                <option value="in-progress">In Progress</option>
                <option value="on-review">On Review</option>
                <option value="in-queue">In Queue</option>
              </select>
              
              <select
                className="bg-cyrus-dark-lighter border border-cyrus-dark-lightest text-white text-sm rounded-lg focus:ring-cyrus-blue focus:border-cyrus-blue p-2.5"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Task Table */}
        <div className="bg-cyrus-dark-light rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-cyrus-dark-lightest">
            <thead className="bg-cyrus-dark-lighter">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Designer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Task
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Update
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-cyrus-dark-light divide-y divide-cyrus-dark-lightest">
              {filteredTodos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTodos.map(todo => (
                  <tr key={todo.id} className="hover:bg-cyrus-dark-lighter cursor-pointer" onClick={() => editTask(todo)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {todo.designer ? (
                          <>
                            <div className="flex-shrink-0 h-8 w-8">
                              <img className="h-8 w-8 rounded-full" src={todo.designer.avatar} alt="" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-white">
                                {todo.designer.name}
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{todo.text}</div>
                      {todo.description && (
                        <div className="text-sm text-gray-400 truncate max-w-xs">{todo.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        todo.status === 'done' ? 'bg-green-900 text-green-300' :
                        todo.status === 'in-progress' ? 'bg-purple-900 text-purple-300' :
                        todo.status === 'on-review' ? 'bg-blue-900 text-blue-300' :
                        'bg-orange-900 text-orange-300'
                      }`}>
                        {todo.status === 'done' && <Check size={12} className="mr-1" />}
                        {todo.status === 'in-progress' && <Edit size={12} className="mr-1" />}
                        {todo.status === 'on-review' && <MessageCircle size={12} className="mr-1" />}
                        {todo.status === 'in-queue' && <Flag size={12} className="mr-1" />}
                        {todo.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        todo.priority === 'high' ? 'bg-red-900 text-red-300' :
                        todo.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatRelativeTime(todo.lastUpdate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-cyrus-blue hover:text-opacity-80 mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          editTask(todo);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="text-cyrus-red hover:text-opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTodo(todo.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-cyrus-dark-light rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-cyrus-dark-light px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                  {currentTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <div className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="task-title" className="block text-sm font-medium text-gray-400">
                      Task Title
                    </label>
                    <input
                      type="text"
                      id="task-title"
                      className="mt-1 focus:ring-cyrus-blue focus:border-cyrus-blue block w-full shadow-sm sm:text-sm border-cyrus-dark-lightest rounded-md bg-cyrus-dark-lighter text-white"
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      placeholder="Enter task title"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="task-description" className="block text-sm font-medium text-gray-400">
                      Description
                    </label>
                    <textarea
                      id="task-description"
                      rows={3}
                      className="mt-1 focus:ring-cyrus-blue focus:border-cyrus-blue block w-full shadow-sm sm:text-sm border-cyrus-dark-lightest rounded-md bg-cyrus-dark-lighter text-white"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Enter task description"
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="task-designer" className="block text-sm font-medium text-gray-400">
                      Assign to Designer
                    </label>
                    <select
                      id="task-designer"
                      className="mt-1 block w-full py-2 px-3 border border-cyrus-dark-lightest bg-cyrus-dark-lighter text-white rounded-md shadow-sm focus:outline-none focus:ring-cyrus-blue focus:border-cyrus-blue sm:text-sm"
                      value={selectedDesigner?.id || ''}
                      onChange={(e) => {
                        const designerId = parseInt(e.target.value);
                        setSelectedDesigner(
                          designerId ? sampleUsers.find(u => u.id === designerId) || null : null
                        );
                      }}
                    >
                      <option value="">Unassigned</option>
                      {sampleUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {currentTask && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400">
                          Status
                        </label>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div
                            className={`cursor-pointer p-2 rounded text-center ${
                              currentTask.status === 'done' ? 'bg-green-900 ring-2 ring-green-500 text-green-300' : 'border border-cyrus-dark-lightest text-gray-400'
                            }`}
                            onClick={() => setCurrentTask({...currentTask, status: 'done', completed: true})}
                          >
                            Done
                          </div>
                          <div
                            className={`cursor-pointer p-2 rounded text-center ${
                              currentTask.status === 'in-progress' ? 'bg-purple-900 ring-2 ring-purple-500 text-purple-300' : 'border border-cyrus-dark-lightest text-gray-400'
                            }`}
                            onClick={() => setCurrentTask({...currentTask, status: 'in-progress', completed: false})}
                          >
                            In Progress
                          </div>
                          <div
                            className={`cursor-pointer p-2 rounded text-center ${
                              currentTask.status === 'on-review' ? 'bg-blue-900 ring-2 ring-blue-500 text-blue-300' : 'border border-cyrus-dark-lightest text-gray-400'
                            }`}
                            onClick={() => setCurrentTask({...currentTask, status: 'on-review', completed: false})}
                          >
                            On Review
                          </div>
                          <div
                            className={`cursor-pointer p-2 rounded text-center ${
                              currentTask.status === 'in-queue' ? 'bg-orange-900 ring-2 ring-orange-500 text-orange-300' : 'border border-cyrus-dark-lightest text-gray-400'
                            }`}
                            onClick={() => setCurrentTask({...currentTask, status: 'in-queue', completed: false})}
                          >
                            In Queue
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400">
                          Priority
                        </label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div
                            className={`cursor-pointer p-2 rounded text-center ${
                              currentTask.priority === 'low' ? 'bg-green-900 ring-2 ring-green-500 text-green-300' : 'border border-cyrus-dark-lightest text-gray-400'
                            }`}
                            onClick={() => setCurrentTask({...currentTask, priority: 'low'})}
                          >
                            Low
                          </div>
                          <div
                            className={`cursor-pointer p-2 rounded text-center ${
                              currentTask.priority === 'medium' ? 'bg-yellow-900 ring-2 ring-yellow-500 text-yellow-300' : 'border border-cyrus-dark-lightest text-gray-400'
                            }`}
                            onClick={() => setCurrentTask({...currentTask, priority: 'medium'})}
                          >
                            Medium
                          </div>
                          <div
                            className={`cursor-pointer p-2 rounded text-center ${
                              currentTask.priority === 'high' ? 'bg-red-900 ring-2 ring-red-500 text-red-300' : 'border border-cyrus-dark-lightest text-gray-400'
                            }`}
                            onClick={() => setCurrentTask({...currentTask, priority: 'high'})}
                          >
                            High
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-cyrus-dark-lighter px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyrus-blue text-base font-medium text-white hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyrus-blue sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={currentTask ? updateTask : addTodo}
                >
                  {currentTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-cyrus-dark-lightest shadow-sm px-4 py-2 bg-cyrus-dark-lighter text-base font-medium text-gray-400 hover:bg-cyrus-dark-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyrus-blue sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToDoPanel;
