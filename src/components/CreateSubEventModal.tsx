import { useState, useEffect, FormEvent } from 'react';
import { Modal } from './Modal';
import { subEventAPI, eventAPI } from '../lib/api';
import { User } from '../types';
import { useToast } from './Toast';

interface CreateSubEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
}

export const CreateSubEventModal = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
}: CreateSubEventModalProps) => {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [selectedSharers, setSelectedSharers] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await eventAPI.getById(eventId);
        const groupResponse = await eventAPI.getById(response.data.groupId);
        setGroupMembers(groupResponse.data.members || []);
      } catch (error) {
        showToast('Failed to load group members', 'error');
      }
    };

    if (isOpen) {
      fetchEventData();
    }
  }, [isOpen, eventId]);

  const toggleSharer = (userId: string) => {
    if (selectedSharers.includes(userId)) {
      setSelectedSharers(selectedSharers.filter((id) => id !== userId));
      const newCustomAmounts = { ...customAmounts };
      delete newCustomAmounts[userId];
      setCustomAmounts(newCustomAmounts);
    } else {
      setSelectedSharers([...selectedSharers, userId]);
    }
  };

  const handleCustomAmountChange = (userId: string, amount: string) => {
    setCustomAmounts({
      ...customAmounts,
      [userId]: amount,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (selectedSharers.length === 0) {
      showToast('Please select at least one sharer', 'error');
      return;
    }

    if (splitType === 'CUSTOM') {
      const totalCustom = selectedSharers.reduce(
        (sum, id) => sum + (parseFloat(customAmounts[id]) || 0),
        0
      );
      if (Math.abs(totalCustom - parseFloat(totalAmount)) > 0.01) {
        showToast('Custom amounts must add up to total amount', 'error');
        return;
      }
    }

    setIsLoading(true);
    try {
      await subEventAPI.create({
        eventId,
        title,
        totalAmount: parseFloat(totalAmount),
        sharerIds: selectedSharers,
        splitType,
        customAmounts:
          splitType === 'CUSTOM'
            ? Object.fromEntries(
                Object.entries(customAmounts).map(([k, v]) => [k, parseFloat(v)])
              )
            : undefined,
      });
      showToast('Payment created successfully!', 'success');
      setTitle('');
      setTotalAmount('');
      setSelectedSharers([]);
      setCustomAmounts({});
      setSplitType('EQUAL');
      onSuccess();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create payment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const equalShare = selectedSharers.length > 0
    ? (parseFloat(totalAmount) || 0) / selectedSharers.length
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Payment">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="e.g., Lunch"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Split Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="EQUAL"
                checked={splitType === 'EQUAL'}
                onChange={() => setSplitType('EQUAL')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Equal Split</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="CUSTOM"
                checked={splitType === 'CUSTOM'}
                onChange={() => setSplitType('CUSTOM')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Custom Amounts</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Sharers
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {groupMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSharers.includes(member.id)}
                    onChange={() => toggleSharer(member.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </span>
                  {splitType === 'EQUAL' && selectedSharers.includes(member.id) && (
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
                      ${equalShare.toFixed(2)}
                    </span>
                  )}
                </label>
                {splitType === 'CUSTOM' && selectedSharers.includes(member.id) && (
                  <input
                    type="number"
                    step="0.01"
                    value={customAmounts[member.id] || ''}
                    onChange={(e) => handleCustomAmountChange(member.id, e.target.value)}
                    className="w-24 px-2 py-1 ml-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                    placeholder="0.00"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Payment'}
        </button>
      </form>
    </Modal>
  );
};
