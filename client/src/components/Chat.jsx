import PropTypes from 'prop-types';

export default function Chat({ messages }) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold">Chat</h3>
      <div className="h-40 overflow-y-auto border p-2">
        {messages.map((msg, i) => (
          <p
            key={i}
            className={msg.isCorrect ? 'text-green-600' : 'text-white'}
          >
            [{new Date(msg.timestamp).toLocaleTimeString()}] {msg.nickname}: {msg.message} {msg.isCorrect ? '(Correct!)' : ''}
          </p>
        ))}
      </div>
    </div>
  );
}

Chat.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      nickname: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      isCorrect: PropTypes.bool,
      timestamp: PropTypes.number.isRequired,
    })
  ).isRequired,
};