import React, { useState } from 'react';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  Search,
  User,
  Clock,
  Check,
  CheckCheck,
  Paperclip
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'doctor';
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  patientName: string;
  doctorName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'ended';
}

const MessagingInterface: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const conversations: Conversation[] = [
    {
      id: '1',
      patientName: 'John Smith',
      doctorName: 'Dr. Johnson',
      lastMessage: 'Thank you for adjusting my medication',
      lastMessageTime: new Date(Date.now() - 15 * 60 * 1000),
      unreadCount: 2,
      status: 'active'
    },
    {
      id: '2',
      patientName: 'Maria Garcia',
      doctorName: 'Dr. Johnson',
      lastMessage: 'My blood pressure readings have been stable',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 0,
      status: 'active'
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      doctorName: 'Dr. Johnson',
      lastMessage: 'Should I be concerned about the recent spike?',
      lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      unreadCount: 1,
      status: 'active'
    }
  ];

  const messages: Message[] = [
    {
      id: '1',
      senderId: 'john-smith',
      senderName: 'John Smith',
      senderType: 'patient',
      content: 'Good morning Dr. Johnson. I wanted to update you on my blood pressure readings.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    },
    {
      id: '2',
      senderId: 'dr-johnson',
      senderName: 'Dr. Johnson',
      senderType: 'doctor',
      content: 'Good morning John! I see your readings from this week. How are you feeling overall?',
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      read: true
    },
    {
      id: '3',
      senderId: 'john-smith',
      senderName: 'John Smith',
      senderType: 'patient',
      content: 'I\'ve been feeling much better since we adjusted the dosage. The morning readings are more consistent now.',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: true
    },
    {
      id: '4',
      senderId: 'dr-johnson',
      senderName: 'Dr. Johnson',
      senderType: 'doctor',
      content: 'That\'s excellent news! Continue with the current medication schedule. Let me know if you notice any changes.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: true
    },
    {
      id: '5',
      senderId: 'john-smith',
      senderName: 'John Smith',
      senderType: 'patient',
      content: 'Thank you for adjusting my medication. I really appreciate your quick response.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      // In real app, this would send the message to the backend
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const filteredConversations = conversations.filter(conv => 
    conv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{conversation.patientName}</h3>
                    <p className="text-sm text-gray-600">{conversation.doctorName}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">{getTimeAgo(conversation.lastMessageTime)}</p>
                  {conversation.unreadCount > 0 && (
                    <div className="mt-1 inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedConv?.patientName}</h3>
                <p className="text-sm text-green-600">Active</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                <Video className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === 'doctor' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${
                  message.senderType === 'doctor' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                } rounded-lg p-3`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-between mt-2 text-xs ${
                    message.senderType === 'doctor' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span>{getTimeAgo(message.timestamp)}</span>
                    {message.senderType === 'doctor' && (
                      <div className="flex items-center space-x-1">
                        {message.read ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
              <button
                type="button"
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-600">Choose a patient conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingInterface;