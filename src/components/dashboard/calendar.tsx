
'use client';

import { useState, useMemo } from 'react';
import type { AllData, WorkoutEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Pill, GlassWater, Syringe, Footprints, Trash2, Edit, Smile, Frown, Meh } from 'lucide-react';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type CalendarView = 'month' | 'week' | 'day';

interface Event {
  type: string;
  detail: string;
  icon: React.ElementType;
  time?: string;
  data?: any;
}

interface CalendarProps {
  allData: AllData;
  onUpdateWorkout: (workout: WorkoutEntry) => void;
  onDeleteWorkout: (id: string) => void;
}

const getMoodIcon = (mood: string) => {
    switch(mood) {
        case 'great': return Smile;
        case 'good': return Smile;
        case 'neutral': return Meh;
        case 'bad': return Frown;
        case 'awful': return Frown;
        default: return Meh;
    }
}

const getEventsForDay = (day: Date, allData: AllData): Event[] => {
  const events: Event[] = [];

  allData.medication.history.forEach(h => {
    if (isSameDay(parseISO(h.date), day)) {
      events.push({ type: 'Medication', detail: `${h.period} dose`, icon: Pill, time: h.time });
    }
  });

  allData.water.history.forEach(h => {
    if (isSameDay(parseISO(h.date), day)) {
      events.push({ type: 'Water', detail: `${h.period} glass`, icon: GlassWater });
    }
  });

  allData.injection.history.forEach(h => {
    if (isSameDay(parseISO(h.date), day)) {
      events.push({ type: 'Injection', detail: 'Mounjaro Shot', icon: Syringe, time: format(parseISO(h.date), 'p') });
    }
  });

  allData.workout.history.forEach(h => {
    if (isSameDay(parseISO(h.date), day)) {
      events.push({ type: 'Workout', detail: h.type, icon: Footprints, time: `${h.startTime} - ${h.endTime}`, data: h });
    }
  });

  allData.mood?.history.forEach(h => {
      if (isSameDay(parseISO(h.date), day)) {
          events.push({ type: 'Mood', detail: h.mood, icon: getMoodIcon(h.mood), time: format(parseISO(h.date), 'p'), data: h });
      }
  });

  return events.sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });
};


const Calendar = ({ allData, onUpdateWorkout, onDeleteWorkout }: CalendarProps) => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState<WorkoutEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (event: Event) => {
    if (event.type === 'Workout' && event.data) {
      setSelectedEvent(event.data);
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteClick = (event: Event) => {
    if (event.type === 'Workout' && event.data) {
      onDeleteWorkout(event.data.id);
      toast({ title: 'Workout deleted successfully!'});
    }
  }

  const handleSaveChanges = () => {
    if (selectedEvent) {
      onUpdateWorkout(selectedEvent);
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      toast({ title: 'Workout updated successfully!'});
    }
  };


  const previous = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(addDays(currentDate, -7));
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
  };

  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
  };
  
  const goToToday = () => {
      setCurrentDate(new Date());
  }

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = startOfWeek(addDays(monthEnd, 6));
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const weekDays = useMemo(() => {
      const start = startOfWeek(currentDate);
      return Array.from({length: 7}).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className='flex items-center gap-4'>
        <h2 className="font-headline text-xl font-semibold">
          {format(currentDate, view === 'month' ? 'MMMM yyyy' : view === 'week' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={previous}><ChevronLeft className="w-5 h-5" /></Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="w-5 h-5" /></Button>
        </div>
      </div>
      <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="day">Day</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderMonthView = () => (
    <>
      <div className="grid grid-cols-7 text-center text-sm text-muted-foreground border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-5">
        {calendarDays.map(day => {
          const events = getEventsForDay(day, allData);
          return (
            <div
              key={day.toString()}
              className={cn(
                'border-r border-b p-2 flex flex-col h-32 overflow-hidden',
                !isSameMonth(day, currentDate) && 'bg-muted/50 text-muted-foreground'
              )}
            >
              <span className={cn('font-medium', isToday(day) && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center')}>{format(day, 'd')}</span>
              <div className="flex-grow overflow-y-auto text-xs mt-1 space-y-1 no-scrollbar">
                {events.map((event, i) => (
                  <div key={i} className="flex items-center gap-1.5 truncate p-1 rounded-sm bg-secondary/30">
                    <event.icon className="w-3 h-3 text-accent shrink-0" />
                    <span className="capitalize truncate">{event.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
  
  const renderWeekView = () => (
      <div className="flex flex-col">
        <div className="grid grid-cols-7 text-center text-sm text-muted-foreground border-b">
            {weekDays.map(day => (
                <div key={day.toString()} className={cn("py-2", isToday(day) && "text-primary font-semibold")}>
                    {format(day, 'EEE d')}
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7 flex-grow">
            {weekDays.map(day => {
                const events = getEventsForDay(day, allData);
                return (
                    <div key={day.toString()} className="border-r p-2 space-y-2 h-[60vh] overflow-y-auto no-scrollbar">
                        {events.length > 0 ? events.map((event, i) => (
                            <Card key={i} className="p-2 group/event relative">
                                <div className="flex items-start gap-2">
                                    <event.icon className="w-4 h-4 text-primary mt-1" />
                                    <div>
                                        <p className="font-semibold text-xs capitalize">{event.type}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{event.detail}</p>
                                        {event.time && <p className="text-xs text-muted-foreground">{event.time}</p>}
                                    </div>
                                </div>
                                {event.type === 'Workout' && (
                                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/event:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick(event)}><Edit className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteClick(event)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                  </div>
                                )}
                            </Card>
                        )) : <p className="text-xs text-muted-foreground text-center pt-4">No events</p>}
                    </div>
                );
            })}
        </div>
    </div>
  );

  const renderDayView = () => {
      const events = getEventsForDay(currentDate, allData);
      return (
          <div className="p-4 space-y-4 h-[60vh] overflow-y-auto">
              {events.length > 0 ? events.map((event, i) => (
                  <Card key={i} className="p-4 group/event relative">
                       <div className="flex items-center gap-3">
                          <event.icon className="h-6 w-6 text-primary" />
                          <div className='flex-1'>
                            <p className="font-semibold text-base capitalize">{event.type}</p>
                            <p className="text-sm text-muted-foreground capitalize">{event.detail}</p>
                            {event.time && <p className="text-sm text-muted-foreground">{event.time}</p>}
                          </div>
                          {event.type === 'Workout' && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/event:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(event)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(event)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          )}
                        </div>
                  </Card>
              )) : <p className="text-sm text-muted-foreground text-center pt-16">No events logged for this day.</p>}
          </div>
      );
  };


  return (
    <Card className="mt-6">
      {renderHeader()}
      <CardContent className="p-0">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </CardContent>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workout</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={format(parseISO(selectedEvent.date), 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, date: new Date(e.target.value).toISOString() })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start-time" className="text-right">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={selectedEvent.startTime}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, startTime: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end-time" className="text-right">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={selectedEvent.endTime}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, endTime: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Calendar;
