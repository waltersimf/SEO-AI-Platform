import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({ value, onChange, disabled, className }: TimePickerProps) {
  const [hours, minutes] = (value || '').split(':');

  const handleHourChange = (h: string) => {
    onChange(`${h}:${minutes || '00'}`);
  };

  const handleMinuteChange = (m: string) => {
    onChange(`${hours || '00'}:${m}`);
  };

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <Select value={hours || ''} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger className="w-[70px] h-9">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={minutes || ''} onValueChange={handleMinuteChange} disabled={disabled}>
        <SelectTrigger className="w-[70px] h-9">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {['00', '15', '30', '45'].map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
