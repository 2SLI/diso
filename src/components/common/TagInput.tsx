import { useState } from 'react';
import { X } from 'lucide-react';
import { Input, Badge } from './ui';
export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState('');
  const add = () => {
    const tag = text.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setText('');
  };
  return (
    <div className="rounded-lg border border-slate-300 p-2">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1">
            <Badge>{tag}</Badge>
            <button type="button" onClick={() => onChange(value.filter((v) => v !== tag))}>
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}
