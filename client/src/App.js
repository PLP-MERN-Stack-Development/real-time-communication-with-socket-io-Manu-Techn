// Import required hooks and custom socket hook
import { useState, useEffect } from 'react'; 
import { useSocket } from './socket';

function App() {
  // Local UI state
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [room, setRoom] = useState('general');
  const [search, setSearch] = useState(''); 

  // File upload state 
  const [file, setFile] = useState(null);

  // Get socket related functions and states from custom hook
  const {
    isConnected,
    messages,
    users,
    typingUsers,
    connect,
    sendMessage,
    setTyping,
    addReaction,
    joinRoom,
    lastMessage,
  } = useSocket();

  // Filter messages based on search
  const filteredMessages = messages.filter(msg =>
    msg.message.toLowerCase().includes(search.toLowerCase())
  );

  // Notification effect
  useEffect(() => {
    if (lastMessage && window.Notification && Notification.permission === 'granted') {
      new Notification(`New message from ${lastMessage.sender}`);
    }
  }, [lastMessage]);

  // Join room 
  const handleRoomChange = (newRoom) => {
    setRoom(newRoom);
    if (joinRoom) joinRoom(newRoom);
  };

  // Send text message 
  const handleSend = () => {
    if (!message.trim()) return; 
    sendMessage(message);
    setMessage('');
  };

  // Handle files
  const handleFileSelect = (e) => {
    setFile(e.target.files?.[0] ?? null);
  };

  // Send file helper: read file as base64 then send a structured payload.
  // Note: server must understand the payload. If your socket hook/server supports
  // a dedicated file event, use that instead of sendMessage.
  const handleFileSend = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      // send an object containing file
      sendMessage({
        type: 'file',
        name: file.name,
        data: e.target.result, // base64 string
      });
      setFile(null); // clear selected file after sending
    };
    reader.readAsDataURL(file);
  };

  // If user is not connected, show the login screen
  if (!isConnected) {
    return (
      <div>
        {/* Username input field */}
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
        />
        {/* Connect button */}
        <button onClick={() => username.trim() && connect(username)}>Join Chat</button>
      </div>
    );
  }

  // If user is connected, show the chat interface
  return (
    <div>
      {/* Room selector and online count */}
      <div>
        <select value={room} onChange={(e) => handleRoomChange(e.target.value)}>
          <option value="general">General</option>
          <option value="random">Random</option>
        </select>
        <div>Online: {users.length}</div>
      </div>

      {/* Search input */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search messages..."
        style={{ marginBottom: '10px' }}
      />

      {/* Messages display area */}
      <div>
        {filteredMessages.map((msg) => ( 
          <div key={msg.id}>
            {/* Sender and message content */}
            <strong>{msg.sender || 'Anon'}</strong>: {msg.message}
            <small>
              {' '}
              {/* show formatted timestamp */}
              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
              {/* read indicator */}
              {msg.readBy && msg.readBy.length > 0 && ` · Read`}
            </small>

            {/* Reaction buttons */}
            <button onClick={() => addReaction(msg.id, '👍')}>
              👍 {msg.reactions?.['👍'] || 0}
            </button>
            <button onClick={() => addReaction(msg.id, '❤️')}>
              ❤️ {msg.reactions?.['❤️'] || 0}
            </button>
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && <div><i>{typingUsers.join(', ')} typing...</i></div>}

      {/* Message input field */}
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type a message"
      />
      {/* Send button */}
      <button onClick={handleSend}>Send</button>

      {/* File upload */}
      <div style={{ marginTop: 12 }}>
        {/* file selection */}
        <input type="file" onChange={handleFileSelect} />
        {/* send selected file */}
        <button onClick={handleFileSend} disabled={!file}>Send File</button>
      </div>
    </div>
  );
}

export default App;
