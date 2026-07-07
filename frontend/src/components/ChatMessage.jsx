export default function ChatMessage({ message, userName }) {
  const isUser = message.role === 'user';
  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  // User initial for avatar
  const initial = userName ? userName[0].toUpperCase() : 'Y';

  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end msg-from-right' : 'justify-start msg-from-left'}`}>
      {/* Vera avatar */}
      {!isUser && (
        <div className="vera-avatar w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
          V
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[74%]`}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'user-bubble text-white rounded-2xl rounded-br-sm'
              : 'vera-bubble text-slate-100 rounded-2xl rounded-bl-sm'
          }`}
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {message.content}
        </div>
        {time && (
          <span className="text-[10px] text-slate-500 px-1">{time}</span>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="w-8 h-8 rounded-full shrink-0 select-none flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', minWidth: 32 }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}
