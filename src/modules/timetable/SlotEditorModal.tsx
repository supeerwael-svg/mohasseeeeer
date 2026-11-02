import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/StatusBlock';
import { TextField } from '@/components/ui/TextField';
import { Modal } from '@/components/ui/Modal';
import { saveTimetableSlot } from '@/db/timetable';
import { TEXT_MAX_LENGTH } from '@/db/studentRules';
import type { Room, Teacher, TimetableSlot } from '@/db/types';
import { useSession } from '@/modules/auth/AuthContext';
import { weekdayName } from '@/utils/calendar';
import { errorKey } from '@/utils/errors';

export interface SlotTarget {
  classId: string;
  day: number;
  period: number;
  slot: TimetableSlot | null;
}

interface SlotEditorModalProps {
  target: SlotTarget | null;
  teachers: Teacher[];
  rooms: Room[];
  onClose: () => void;
  onSaved: () => void;
  onRemove: (slot: TimetableSlot) => void;
}

export function SlotEditorModal({ target, teachers, rooms, onClose, onSaved, onRemove }: SlotEditorModalProps) {
  const { t, i18n } = useTranslation();
  const title = target
    ? t('timetable.slotTitle', { day: weekdayName(target.day, i18n.language, 'long'), period: target.period })
    : '';

  return (
    <Modal open={target !== null} title={title} onClose={onClose}>
      {target ? (
        <SlotForm
          key={`${target.day}-${target.period}-${target.slot?.id ?? 'new'}`}
          target={target}
          teachers={teachers}
          rooms={rooms}
          onSaved={onSaved}
          onRemove={onRemove}
        />
      ) : null}
    </Modal>
  );
}

interface SlotFormProps {
  target: SlotTarget;
  teachers: Teacher[];
  rooms: Room[];
  onSaved: () => void;
  onRemove: (slot: TimetableSlot) => void;
}

function SlotForm({ target, teachers, rooms, onSaved, onRemove }: SlotFormProps) {
  const { t } = useTranslation();
  const { user, institution } = useSession();
  const existingSlot = target.slot;
  const [subject, setSubject] = useState(existingSlot?.subject ?? '');
  const [teacherId, setTeacherId] = useState(existingSlot?.teacherId ?? '');
  const [roomId, setRoomId] = useState(existingSlot?.roomId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveTimetableSlot(institution.id, user.id, {
        classId: target.classId,
        day: target.day,
        period: target.period,
        subject,
        teacherId: teacherId || null,
        roomId: roomId || null,
      });
      onSaved();
    } catch (saveError) {
      setError(t(errorKey(saveError)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <TextField
        id="slot-subject"
        label={t('timetable.subject')}
        value={subject}
        maxLength={TEXT_MAX_LENGTH}
        onChange={(event) => setSubject(event.target.value)}
        autoFocus
        required
      />
      <SelectField
        id="slot-teacher"
        label={t('timetable.teacher')}
        value={teacherId}
        onChange={setTeacherId}
        options={[{ value: '', label: t('timetable.noTeacher') }, ...teachers.map((teacher) => ({ value: teacher.id, label: teacher.name }))]}
      />
      <SelectField
        id="slot-room"
        label={t('timetable.room')}
        value={roomId}
        onChange={setRoomId}
        options={[{ value: '', label: t('timetable.noRoom') }, ...rooms.map((room) => ({ value: room.id, label: room.name }))]}
      />
      <FormError message={error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {existingSlot ? (
          <Button variant="ghost" onClick={() => onRemove(existingSlot)} icon={<Trash2 className="size-5" aria-hidden />}>
            {t('timetable.clearSlot')}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={saving || subject.trim() === ''}>
          {t('timetable.saveSlot')}
        </Button>
      </div>
    </form>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SelectField({ id, label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-xl bg-white px-4 text-base text-neutral-900 ring-1 ring-neutral-300 transition focus:outline-none focus:ring-4 focus:ring-primary-500/15"
      >
        {options.map((option) => (
          <option key={option.value || 'none'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
