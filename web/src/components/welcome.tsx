import { useState, useEffect } from 'react';

interface WelcomeProps {
  userName?: string;
}

export default function Welcome({ userName }: WelcomeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Set greeting based on time of day
    const hour = currentTime.getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }

    return () => clearInterval(timer);
  }, [currentTime]);

  return (
    <div className="welcome-container">
      {/* Header Section */}
      <div className="welcome-header">
        <h1 className="welcome-title">
          {greeting}{userName ? `, ${userName}` : ''}!
        </h1>
      </div>
    </div>
  );
}
