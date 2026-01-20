import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './NotificationBell.css';

function NotificationBell({ onClick }) {
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userProfile?.warnings) {
      const unread = userProfile.warnings.filter(w => !w.read).length;
      setUnreadCount(unread);
    }
  }, [userProfile]);

  return (
    <button className="notification-bell" onClick={onClick}>
      🔔
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </button>
  );
}

export default NotificationBell;
