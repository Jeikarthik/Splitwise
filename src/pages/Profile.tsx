import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Mail, User as UserIcon } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Profile</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <UserIcon className="w-4 h-4" />
                Full Name
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                {user?.name}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
