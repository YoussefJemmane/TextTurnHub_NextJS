"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  Users,
  Package,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  BarChart2,
  Edit2,
  Trash2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw
} from "lucide-react";

// Mock data for demo
const mockStats = {
  overview: {
    users: { total: 1250, new: 85, byRole: { admin: 5, company: 120, artisan: 380, user: 745 } },
    products: { total: 3420, new: 145, totalSales: 25640 },
    waste: { total: 890, new: 23 },
    exchanges: { total: 1560, completed: 1340 }
  },
  timeSeries: {
    users: { 
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], 
      data: [800, 950, 1050, 1150, 1200, 1250] 
    },
    products: { 
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], 
      data: [2100, 2450, 2800, 3050, 3200, 3420] 
    },
    exchanges: { 
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], 
      data: [650, 890, 1150, 1340, 1450, 1560] 
    }
  }
};

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", roles: ["admin"], created_at: "2024-01-15" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", roles: ["company"], created_at: "2024-02-20" },
  { id: 3, name: "Bob Wilson", email: "bob@example.com", roles: ["artisan"], created_at: "2024-03-10" },
  { id: 4, name: "Alice Johnson", email: "alice@example.com", roles: ["user"], created_at: "2024-04-05" },
  { id: 5, name: "Mike Brown", email: "mike@example.com", roles: ["company", "user"], created_at: "2024-05-12" }
];

interface AdminStats {
  overview: {
    users: { total: number; new: number; byRole: Record<string, number> };
    products: { total: number; new: number; totalSales: number };
    waste: { total: number; new: number };
    exchanges: { total: number; completed: number };
  };
  timeSeries: {
    users: { labels: string[]; data: number[] };
    products: { labels: string[]; data: number[] };
    exchanges: { labels: string[]; data: number[] };
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  created_at: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const StatCard = ({ title, value, trend, icon, color }: any) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 ${color} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${
          trend.positive 
            ? 'text-emerald-700 bg-emerald-50' 
            : 'text-red-700 bg-red-50'
        }`}>
          {trend.positive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          {trend.value}%
        </div>
      )}
    </div>
    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</h3>
    <div className="text-3xl font-bold mt-2 text-gray-900">{value.toLocaleString()}</div>
  </div>
);

const EditUserModal = ({ user, isOpen, onClose, onSave, availableRoles }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roles: [] as string[]
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        roles: user.roles
      });
    } else {
      setFormData({ name: '', email: '', roles: [] });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: user?.id });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">{user ? 'Edit User' : 'Add User'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="space-y-2">
              {availableRoles.map((role: string) => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, roles: [...formData.roles, role] });
                      } else {
                        setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, itemName }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete {itemName}</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this {itemName}? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notification = ({ type, message, onClose }: any) => {
  const bgColor = 
    type === 'success' ? 'bg-green-50 border border-green-200' : 
    type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
    'bg-red-50 border border-red-200';
    
  const textColor = 
    type === 'success' ? 'text-green-400' : 
    type === 'warning' ? 'text-yellow-400' :
    'text-red-400';
    
  const messageColor = 
    type === 'success' ? 'text-green-800' : 
    type === 'warning' ? 'text-yellow-800' :
    'text-red-800';
  
  const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✗';
  
  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${bgColor}`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${textColor}`}>
          {icon}
        </div>
        <div className={`ml-3 text-sm font-medium ${messageColor}`}>
          {message}
        </div>
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [notification, setNotification] = useState<any>(null);

  const availableRoles = ['admin', 'company', 'artisan', 'user'];

  // Fetch dashboard statistics from API
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setStatsError(null);
      
      const response = await fetch(`/api/admin/stats?timeRange=${timeRange}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard statistics');
      }
      
      const data = await response.json();
      setStats(data);
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Fall back to mock data
      setStats(mockStats);
      
      // Set a warning notification instead of error
      setNotification({
        type: 'warning',
        message: 'Using mock data. API error: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
      
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setUsersError(null);
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  // Fetch data on component mount and when timeRange changes
  useEffect(() => {
    fetchDashboardStats();
  }, [timeRange]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = async (userData: any) => {
    try {
      const method = userData.id ? 'PUT' : 'POST';
      const url = userData.id ? `/api/admin/users/${userData.id}` : '/api/admin/users';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${userData.id ? 'update' : 'create'} user`);
      }
      
      // Refresh users list
      fetchUsers();
      
      setNotification({
        type: 'success',
        message: `User ${userData.id ? 'updated' : 'created'} successfully`
      });
    } catch (error) {
      console.error('Error saving user:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
    
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      // Refresh users list
      fetchUsers();
      
      setNotification({
        type: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
    
    setDeleteModalOpen(false);
    setUserToDelete(null);
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Don't show error state since we're falling back to mock data

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <div className="text-yellow-600 mb-4">No dashboard data available</div>
      </div>
    );
  }

  const roleData = Object.entries(stats.overview.users.byRole).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const chartData = stats.timeSeries.users.labels.map((label, index) => ({
    name: label,
    users: stats.timeSeries.users.data[index],
    products: stats.timeSeries.products.data[index],
    exchanges: stats.timeSeries.exchanges.data[index],
  }));

  return (
    <div className="space-y-8">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button 
          onClick={() => {
            fetchDashboardStats();
            fetchUsers();
          }}
          className="flex items-center px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>
      {/* Header with time range selector */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.overview.users.total}
          trend={{
            positive: true,
            value: ((stats.overview.users.new / stats.overview.users.total) * 100).toFixed(1)
          }}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Products"
          value={stats.overview.products.total}
          trend={{
            positive: true,
            value: ((stats.overview.products.new / stats.overview.products.total) * 100).toFixed(1)
          }}
          icon={<ShoppingBag className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Waste Listings"
          value={stats.overview.waste.total}
          trend={{
            positive: true,
            value: ((stats.overview.waste.new / stats.overview.waste.total) * 100).toFixed(1)
          }}
          icon={<Package className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Exchanges"
          value={stats.overview.exchanges.total}
          trend={{
            positive: true,
            value: ((stats.overview.exchanges.completed / stats.overview.exchanges.total) * 100).toFixed(1)
          }}
          icon={<BarChart2 className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-900">Platform Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} name="Users" />
                <Line type="monotone" dataKey="products" stroke="#10B981" strokeWidth={3} name="Products" />
                <Line type="monotone" dataKey="exchanges" stroke="#F59E0B" strokeWidth={3} name="Exchanges" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-900">User Roles Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Status Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-900">Transaction Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: stats.overview.exchanges.completed },
                    { name: 'Pending', value: stats.overview.exchanges.total - stats.overview.exchanges.completed }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditUserModal
        user={selectedUser}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleEditUser}
        availableRoles={availableRoles}
      />

      <DeleteConfirmation
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        itemName={userToDelete ? userToDelete.name : ''}
      />

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

