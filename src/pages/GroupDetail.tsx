import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Users, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { groupAPI, eventAPI } from '../lib/api';
import { Group, Event } from '../types';
import { useToast } from '../components/Toast';
import { CreateEventModal } from '../components/CreateEventModal';

export const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  const fetchGroupData = async () => {
    if (!groupId) return;

    try {
      const groupResponse = await groupAPI.getById(groupId);
      setGroup(groupResponse.data);
      await fetchEvents();
    } catch (error) {
      showToast('Failed to load group', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!groupId) return;

    const startDate = new Date(currentWeekStart);
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 7);

    try {
      const response = await eventAPI.getByGroup(
        groupId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      setEvents(response.data);
    } catch (error) {
      showToast('Failed to load events', 'error');
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    if (group) {
      fetchEvents();
    }
  }, [currentWeekStart]);

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const formatDateRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const handleEventCreated = () => {
    setShowCreateModal(false);
    fetchEvents();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-600 dark:text-gray-400">Group not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <ToastContainer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{group.name}</h1>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="w-5 h-5" />
            <span>{group.members.length} members</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Members</h2>
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">{member.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={prevWeek}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDateRange()}
              </span>
            </div>
            <button
              onClick={nextWeek}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No events this week
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create an event to start tracking expenses
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-blue-500"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {event.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {new Date(event.startDate).toLocaleDateString()} -{' '}
                  {new Date(event.endDate).toLocaleDateString()}
                </p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ${event.totalAmount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleEventCreated}
        groupId={groupId!}
      />
    </div>
  );
};
