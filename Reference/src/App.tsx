import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { GuestNameInput } from './components/GuestNameInput';
import { RoomOptions } from './components/RoomOptions';
import { JoinRoomForm } from './components/JoinRoomForm';
import { RoomCreated } from './components/RoomCreated';

type View = 'landing' | 'guest-name' | 'room-options' | 'join-room' | 'room-created';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [userName, setUserName] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');

  const handleGoogleLogin = () => {
    console.log('Google login initiated');
    setUserName('Google User');
    setView('room-options');
  };

  const handleGuestClick = () => {
    setView('guest-name');
  };

  const handleGuestNameSubmit = (name: string) => {
    setUserName(name);
    setView('room-options');
  };

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setView('room-created');
  };

  const handleJoinClick = () => {
    setView('join-room');
  };

  const handleJoinRoom = (code: string) => {
    setRoomCode(code);
    console.log('Joining room:', code);
  };

  const handleBack = () => {
    setView('room-options');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      {view === 'landing' && (
        <LandingPage
          onGoogleLogin={handleGoogleLogin}
          onGuestClick={handleGuestClick}
        />
      )}
      
      {view === 'guest-name' && (
        <GuestNameInput onSubmit={handleGuestNameSubmit} />
      )}
      
      {view === 'room-options' && (
        <RoomOptions
          userName={userName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinClick}
        />
      )}
      
      {view === 'join-room' && (
        <JoinRoomForm
          onJoin={handleJoinRoom}
          onBack={handleBack}
        />
      )}
      
      {view === 'room-created' && (
        <RoomCreated
          roomCode={roomCode}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
