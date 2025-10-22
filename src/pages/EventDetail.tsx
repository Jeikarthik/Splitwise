import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Calendar, Plus, DollarSign, Users, CheckCircle } from 'lucide-react';
import { eventAPI, subEventAPI } from '../lib/api';
import { Event, SubEvent } from '../types';
import { useToast } from '../components/Toast';
import { CreateSubEventModal } from '../components/CreateSubEventModal';
import { useAuth } from '../contexts/AuthContext';

export const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  const fetchEventData = async () => {
    if (!eventId) return;

    try {
      const [eventResponse, subEventsResponse] = await Promise.all([
        eventAPI.getById(eventId),
        subEventAPI.getByEvent(eventId),
      ]);
      setEvent(eventResponse.data);
      setSubEvents(subEventsResponse.data);
    } catch (error) {
      showToast('Failed to load event', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleSubEventCreated = () => {
    setShowCreateModal(false);
    fetchEventData();
  };

  const handleMarkPaid = async (subEventId: string) => {
    try {
      await subEventAPI.updateShareStatus(subEventId, 'PAID');
      showToast('Marked as paid!', 'success');
      fetchEventData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleConfirmPayment = async (subEventId: string) => {
    try {
      await subEventAPI.updateShareStatus(subEventId, 'CONFIRMED');
      showToast('Payment confirmed!', 'success');
      fetchEventData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to confirm payment', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      PAID: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      CONFIRMED: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    };
    return badges[status as keyof typeof badges] || badges.PENDING;
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-600 dark:text-gray-400">Event not found</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h1>
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>
                {new Date(event.startDate).toLocaleDateString()} -{' '}
                {new Date(event.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ${event.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Payments</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Payment
          </button>
        </div>

        {subEvents.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No payments yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create a payment to start tracking expenses for this event
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subEvents.map((subEvent) => {
              const userShare = subEvent.sharers.find((s) => s.userId === user?.id);
              const allPaid = subEvent.sharers.every((s) => s.status === 'PAID' || s.status === 'CONFIRMED');
              const isPayer = subEvent.payerId === user?.id;

              return (
                <div
                  key={subEvent.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {subEvent.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Paid by {subEvent.payerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${subEvent.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Shared between {subEvent.sharers.length} people
                      </span>
                    </div>

                    <div className="space-y-2">
                      {subEvent.sharers.map((sharer) => (
                        <div
                          key={sharer.userId}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {sharer.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {sharer.userName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                ${sharer.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(sharer.status)}`}
                            >
                              {sharer.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {userShare && userShare.status === 'PENDING' && !isPayer && (
                      <button
                        onClick={() => handleMarkPaid(subEvent.id)}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Mark My Share as Paid
                      </button>
                    )}

                    {isPayer && allPaid && (
                      <button
                        onClick={() => handleConfirmPayment(subEvent.id)}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Confirm All Payments
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateSubEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSubEventCreated}
        eventId={eventId!}
      />
    </div>
  );
};
