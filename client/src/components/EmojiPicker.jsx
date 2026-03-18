import React, { useState, useMemo } from 'react';

const EMOJIS = {
  'Frequently Used': ['👍','👎','😂','❤️','🎉','🚀','👀','🔥','💯','✅','👏','🙌'],
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😉','😊','😇','😍','🤩','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😮‍💨','🤥'],
  'People': ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏'],
  'Nature': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🐝','🦋','🐌','🐛'],
  'Food': ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🍕','🌮','🍔','🍟','🌭','🍿','🧀','🥐'],
  'Objects': ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💾','💿','📷','📹','🎥','📺','📻','⏰','🔋','🔌','💡','🔦','🕯️','📦','📫','✂️','📌','📎'],
  'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝','⭐','🌟','💫','✨','🎯','💢','♻️','✅','❌','❓','❗','💤'],
};

export default function EmojiPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return EMOJIS;
    const result = {};
    for (const [cat, emojis] of Object.entries(EMOJIS)) {
      const matches = emojis.filter(() => true); // Emojis don't have text names in this simple version
      if (matches.length) result[cat] = matches;
    }
    return result;
  }, [search]);

  return (
    <>
      <div className="emoji-picker-overlay" onClick={onClose} />
      <div className="emoji-picker">
        <input
          className="emoji-picker__search"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="emoji-picker__grid">
          {Object.entries(filtered).map(([category, emojis]) => (
            <React.Fragment key={category}>
              <div className="emoji-picker__category-label">{category}</div>
              {emojis.map((emoji, i) => (
                <button
                  key={`${category}-${i}`}
                  className="emoji-picker__item"
                  onClick={() => onSelect(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
