export const steps = [
  {
    status: 'pending',
    label: 'Pending',
    description: 'Your order has been created and is awaiting processing.',
    icon: { iconName: 'time-line', activeBg: 'bg-red-500', inactiveText: 'text-gray-800' },
  },
  {
    status: 'processing',
    label: 'Processing',
    description: 'Your order is currently being processed.',
    icon: { iconName: 'loader-line', activeBg: 'bg-yellow-500', inactiveText: 'text-yellow-800' },
  },
  {
    status: 'shipped',
    label: 'Shipped',
    description: 'Your order has been shipped.',
    icon: { iconName: 'truck-line', activeBg: 'bg-blue-500', inactiveText: 'text-blue-800' },
  },
  {
    status: 'completed',
    label: 'Completed',
    description: 'Your order has been successfully completed.',
    icon: { iconName: 'check-line', activeBg: 'bg-green-600', inactiveText: 'text-green-900' },
  },
];
