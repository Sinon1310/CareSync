import toast from 'react-hot-toast';

// Custom toast styles and utilities
export const showSuccessToast = (message: string, duration: number = 4000) => {
  toast.success(message, {
    duration,
    style: {
      background: '#10B981',
      color: '#ffffff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#10B981',
    },
  });
};

export const showErrorToast = (message: string, duration: number = 6000) => {
  toast.error(message, {
    duration,
    style: {
      background: '#EF4444',
      color: '#ffffff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#EF4444',
    },
  });
};

export const showWarningToast = (message: string, duration: number = 5000) => {
  toast(message, {
    duration,
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#ffffff',
      fontWeight: '500',
    },
  });
};

export const showInfoToast = (message: string, duration: number = 4000) => {
  toast(message, {
    duration,
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#ffffff',
      fontWeight: '500',
    },
  });
};

// Medical-specific toasts
export const showVitalSavedToast = () => {
  showSuccessToast('✅ Vital signs recorded successfully');
};

export const showMedicationTakenToast = (medicationName: string) => {
  showSuccessToast(`💊 ${medicationName} logged successfully`);
};

export const showMessageSentToast = () => {
  showSuccessToast('💬 Message sent successfully');
};

export const showConnectionErrorToast = () => {
  showErrorToast('🔌 Connection error. Please check your internet and try again.');
};

export const showAuthErrorToast = () => {
  showErrorToast('🔐 Authentication failed. Please sign in again.');
};

export const showValidationErrorToast = (field: string) => {
  showErrorToast(`📝 Please enter a valid ${field}`);
};

// Loading toast with promise
export const showLoadingToast = async <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> => {
  return toast.promise(promise, messages, {
    style: {
      minWidth: '250px',
    },
    success: {
      style: {
        background: '#10B981',
        color: '#ffffff',
      },
    },
    error: {
      style: {
        background: '#EF4444',
        color: '#ffffff',
      },
    },
  });
};
