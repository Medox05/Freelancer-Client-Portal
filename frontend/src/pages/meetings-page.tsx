import { useState } from "react";
import { format, isSameDay, parseISO, addMinutes } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Calendar, Clock, Video, Plus, Check, X, Trash, User as UserIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DatePicker from "../components/ui/date-picker";
import Select from "react-select";
import { getMeetings, createMeeting, updateMeetingStatus, deleteMeeting, type Meeting } from "../services/meeting-service";
import api from "../lib/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type UserType = {
  id: number;
  name: string;
  email: string;
};

export default function MeetingsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: getMeetings,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    staleTime: 5000,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["meeting-contacts"],
    queryFn: async () => {
      const { data } = await api.get<UserType[]>("/video-calls/available-users");
      return data;
    },
  });

  const selectedDayMeetings = meetings.filter((m) =>
    date ? isSameDay(parseISO(m.start_time), date) : false
  );

  const pendingMeetings = meetings.filter((m) => m.status === "pending");

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "confirmed" | "cancelled" }) =>
      updateMeetingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting status updated");
    },
    onError: () => {
      toast.error("Failed to update meeting status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setDeleteTarget(null);
      toast.success("Meeting deleted");
    },
    onError: () => {
      setDeleteTarget(null);
      toast.error("Failed to delete meeting");
    }
  });

  const getOtherUser = (meeting: Meeting) => {
    return meeting.freelancer_id === currentUser.id ? meeting.client : meeting.freelancer;
  };

  return (
    <div className="flex h-full flex-col md:flex-row gap-6 p-6">
      {/* Left Sidebar: Calendar & Stats */}
      <div className="w-full md:w-96 flex-shrink-0 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={20} className="text-blue-500" />
              Calendar
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30 transition"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="calendar-wrapper custom-calendar">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              modifiers={{
                hasMeeting: meetings.map((m) => parseISO(m.start_time)),
              }}
              modifiersClassNames={{
                selected: "bg-blue-600 text-white hover:bg-blue-700",
                hasMeeting: "font-bold text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-4 decoration-blue-500/30",
              }}
            />
          </div>
        </div>

        {pendingMeetings.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} />
              Pending Requests ({pendingMeetings.length})
            </h3>
            <div className="space-y-3">
               {pendingMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-xl bg-white p-3 shadow-sm border border-amber-100 dark:border-amber-800/30 dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900 dark:text-white text-sm leading-tight">{meeting.title}</p>
                    {meeting.created_by === currentUser.id && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-semibold dark:bg-blue-500/10 dark:text-blue-400">
                        Sent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    With {getOtherUser(meeting).name} • {format(parseISO(meeting.start_time), "MMM d, h:mm a")}
                  </p>
                  {meeting.created_by !== currentUser.id ? (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => statusMutation.mutate({ id: meeting.id, status: "confirmed" })}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold dark:bg-emerald-500/20 dark:text-emerald-400"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: meeting.id, status: "cancelled" })}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold dark:bg-red-500/20 dark:text-red-400"
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="px-3 py-1.5 rounded-lg bg-amber-100/50 text-amber-700 text-xs font-semibold text-center dark:bg-amber-500/10 dark:text-amber-400">
                        Waiting for response...
                      </div>
                      <button
                        onClick={() => setDeleteTarget(meeting)}
                        className="cursor-pointer flex items-center justify-center gap-1 py-1 px-3 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 text-xs font-medium transition dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700/50"
                      >
                        <Trash size={12} /> Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Meeting List */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Meetings on {date ? format(date, "MMMM d, yyyy") : "Selected Date"}
          </h2>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-slate-400">Loading...</div>
          ) : selectedDayMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Calendar size={48} className="mb-4 opacity-20" />
              <p>No meetings scheduled for this day.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                + Schedule a meeting
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayMeetings.map((meeting) => {
                const hasPassed = parseISO(meeting.end_time) < new Date();
                return (
                  <div
                    key={meeting.id}
                    className={`flex flex-col sm:flex-row gap-4 rounded-xl border p-4 transition-colors ${
                      hasPassed
                        ? "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/20 opacity-60"
                        : meeting.status === "confirmed"
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10"
                        : meeting.status === "pending"
                        ? "border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10"
                        : meeting.status === "cancelled"
                        ? "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 opacity-70"
                        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 opacity-60"
                    }`}
                  >
                    <div className="flex w-32 flex-col justify-center border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 pb-4 sm:pb-0 sm:pr-4">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {format(parseISO(meeting.start_time), "h:mm a")}
                      </span>
                      <span className="text-sm text-slate-500">
                        {format(parseISO(meeting.end_time), "h:mm a")}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                        {meeting.title}
                        {hasPassed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            Ended
                          </span>
                        ) : meeting.status === "confirmed" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                            Confirmed
                          </span>
                        ) : meeting.status === "pending" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                            Pending
                          </span>
                        ) : (
                          meeting.status === "cancelled" && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                              Cancelled
                            </span>
                          )
                        )}
                      </h3>
                      {meeting.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                          {meeting.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                        <UserIcon size={14} />
                        With {getOtherUser(meeting).name}
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-center gap-2 pt-4 sm:pt-0">
                      {meeting.status === "confirmed" && !hasPassed && (
                        <button
                          onClick={() => navigate(`/calls?callee_id=${getOtherUser(meeting).id}`)}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                        >
                          <Video size={16} />
                          Join Call
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(meeting)}
                        className="cursor-pointer p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <ScheduleModal
          contacts={contacts}
          onClose={() => setIsModalOpen(false)}
          selectedDate={date}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {deleteTarget.status === "pending" && deleteTarget.created_by === currentUser.id 
                    ? "Cancel Meeting Request" 
                    : "Confirm Delete"}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {deleteTarget.status === "pending" && deleteTarget.created_by === currentUser.id 
                    ? "Are you sure you want to cancel this meeting request?" 
                    : "You are about to delete this meeting."}
                </p>
              </div>

              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="font-medium">{deleteTarget.title}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {format(parseISO(deleteTarget.start_time), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-2xl border border-slate-300 px-4 py-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="cursor-pointer rounded-2xl bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleteMutation.isPending 
                  ? "Processing..." 
                  : deleteTarget.status === "pending" && deleteTarget.created_by === currentUser.id 
                    ? "Yes, cancel request" 
                    : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleModal({
  contacts,
  onClose,
  selectedDate,
}: {
  contacts: UserType[];
  onClose: () => void;
  selectedDate?: Date;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateObj, setDateObj] = useState<Date | null>(selectedDate || new Date());
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("30");
  const [otherUserId, setOtherUserId] = useState(contacts.length > 0 ? contacts[0].id.toString() : "");

  const queryClient = useQueryClient();
  const isDark = document.documentElement.classList.contains("dark");

  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const timeValue = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const d = new Date(`2000-01-01T${timeValue}:00`);
      timeOptions.push({
        value: timeValue,
        label: format(d, "h:mm a"),
      });
    }
  }

  const durationOptions = [
    { value: "15", label: "15 Minutes" },
    { value: "30", label: "30 Minutes" },
    { value: "45", label: "45 Minutes" },
    { value: "60", label: "1 Hour" },
    { value: "90", label: "1.5 Hours" },
    { value: "120", label: "2 Hours" },
  ];

  const createMutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting requested successfully!");
      onClose();
    },
    onError: () => {
      toast.error("Failed to schedule meeting");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !otherUserId || !dateObj || !time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const dateStr = format(dateObj, "yyyy-MM-dd");
    const startDateTime = new Date(`${dateStr}T${time}`);
    const endDateTime = addMinutes(startDateTime, parseInt(duration));

    createMutation.mutate({
      title,
      description,
      other_user_id: parseInt(otherUserId),
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Schedule Meeting</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Kickoff"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              With Who? *
            </label>
            <Select
              options={contacts.map(c => ({ value: c.id.toString(), label: `${c.name} (${c.email})` }))}
              value={
                contacts.find(c => c.id.toString() === otherUserId)
                  ? {
                      value: otherUserId,
                      label: `${contacts.find(c => c.id.toString() === otherUserId)?.name} (${contacts.find(c => c.id.toString() === otherUserId)?.email})`
                    }
                  : null
              }
              onChange={(option) => setOtherUserId(option?.value || "")}
              placeholder="Select contact..."
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 50,
                  borderRadius: 16,
                  borderColor: state.isFocused ? (isDark ? "#cbd5e1" : "#334155") : (isDark ? "#334155" : "#cbd5e1"),
                  boxShadow: "none",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc", // slate-800 or slate-50
                  paddingLeft: 6,
                  cursor: "pointer",
                  "&:hover": { borderColor: isDark ? "#94a3b8" : "#94a3b8" },
                }),
                singleValue: (base) => ({
                  ...base,
                  color: isDark ? "#ffffff" : "#0f172a",
                }),
                menu: (base) => ({ ...base, borderRadius: 16, overflow: "hidden", zIndex: 50, backgroundColor: isDark ? "#1e293b" : "#ffffff" }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected 
                    ? (isDark ? "#ffffff" : "#0f172a") 
                    : state.isFocused 
                      ? (isDark ? "#334155" : "#f1f5f9") 
                      : "transparent",
                  color: state.isSelected 
                    ? (isDark ? "#0f172a" : "#ffffff") 
                    : (isDark ? "#ffffff" : "#0f172a"),
                  cursor: "pointer",
                  paddingTop: 10,
                  paddingBottom: 10,
                }),
              }}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Date *
              </label>
              <DatePicker
                value={dateObj}
                onChange={setDateObj}
                placeholder="Select date"
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Time *
              </label>
              <Select
                options={timeOptions}
                value={timeOptions.find((o) => o.value === time) || null}
                onChange={(option) => setTime(option?.value || "10:00")}
                isSearchable={false}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: 50,
                    borderRadius: 16,
                    borderColor: state.isFocused ? (isDark ? "#cbd5e1" : "#334155") : (isDark ? "#334155" : "#cbd5e1"),
                    boxShadow: "none",
                    backgroundColor: isDark ? "#1e293b" : "#f8fafc", // slate-800 or slate-50
                    paddingLeft: 6,
                    cursor: "pointer",
                    "&:hover": { borderColor: isDark ? "#94a3b8" : "#94a3b8" },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: isDark ? "#ffffff" : "#0f172a",
                  }),
                  menu: (base) => ({ ...base, borderRadius: 16, overflow: "hidden", zIndex: 50, backgroundColor: isDark ? "#1e293b" : "#ffffff" }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected 
                      ? (isDark ? "#ffffff" : "#0f172a") 
                      : state.isFocused 
                        ? (isDark ? "#334155" : "#f1f5f9") 
                        : "transparent",
                    color: state.isSelected 
                      ? (isDark ? "#0f172a" : "#ffffff") 
                      : (isDark ? "#ffffff" : "#0f172a"),
                    cursor: "pointer",
                    paddingTop: 10,
                    paddingBottom: 10,
                  }),
                }}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Duration *
            </label>
            <Select
              options={durationOptions}
              value={durationOptions.find((o) => o.value === duration) || null}
              onChange={(option) => setDuration(option?.value || "30")}
              isSearchable={false}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 50,
                  borderRadius: 16,
                  borderColor: state.isFocused ? (isDark ? "#cbd5e1" : "#334155") : (isDark ? "#334155" : "#cbd5e1"),
                  boxShadow: "none",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  paddingLeft: 6,
                  cursor: "pointer",
                  "&:hover": { borderColor: isDark ? "#94a3b8" : "#94a3b8" },
                }),
                singleValue: (base) => ({
                  ...base,
                  color: isDark ? "#ffffff" : "#0f172a",
                }),
                menu: (base) => ({ ...base, borderRadius: 16, overflow: "hidden", zIndex: 50, backgroundColor: isDark ? "#1e293b" : "#ffffff" }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected 
                    ? (isDark ? "#ffffff" : "#0f172a") 
                    : state.isFocused 
                      ? (isDark ? "#334155" : "#f1f5f9") 
                      : "transparent",
                  color: state.isSelected 
                    ? (isDark ? "#0f172a" : "#ffffff") 
                    : (isDark ? "#ffffff" : "#0f172a"),
                  cursor: "pointer",
                  paddingTop: 10,
                  paddingBottom: 10,
                }),
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details about this meeting..."
              rows={2}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-2xl bg-slate-900 py-3 font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              {createMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
