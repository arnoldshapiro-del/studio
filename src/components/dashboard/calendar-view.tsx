
'use client';

import { useState } from 'react';
import { AllData } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseISO, isSameDay } from 'date-fns';
import { Pill, GlassWater, Syringe, Footprints } from 'lucide-react';

interface CalendarViewProps {
  allData: AllData;
}

const CalendarView = ({ allData }: CalendarViewProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const getEventsForDay = (day: Date | undefined) => {
    if (!day) return [];

    const events = [];

    // Medication
    allData.medication.history.forEach(h => {
      if (isSameDay(parseISO(h.date), day)) {
        events.push({ type: 'Medication', detail: h.period, icon: Pill });
      }
    });

    // Water
    allData.water.history.forEach(h => {
      if (isSameDay(parseISO(h.date), day)) {
        events.push({ type: 'Water', detail: h.period, icon: GlassWater });
      }
    });

    // Injections
    allData.injection.history.forEach(h => {
      if (isSameDay(parseISO(h), day)) {
        events.push({ type: 'Injection', detail: 'Mounjaro Shot', icon: Syringe });
      }
    });

    // Workouts
    allData.workout.history.forEach(h => {
      if (isSameDay(parseISO(h.date), day)) {
        events.push({ type: 'Workout', detail: h.type, icon: Footprints });
      }
    });

    return events;
  };

  const selectedDayEvents = getEventsForDay(date);

  const DayWithEvents = ({ date }: { date: Date }) => {
    const events = getEventsForDay(date);
    const hasEvents = events.length > 0;

    return (
      <div className="relative">
        {date.getDate()}
        {hasEvents && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <Card className="lg:col-span-2">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-0 [&_td]:w-full"
            components={{
                Day: ({ date }) => <DayWithEvents date={date} />,
            }}
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
              day_today: "bg-accent text-accent-foreground rounded-full",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">
            Events for {date ? date.toLocaleDateString() : '...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDayEvents.length > 0 ? (
            <ul className="space-y-3">
              {selectedDayEvents.map((event, index) => (
                <li key={index} className="flex items-center gap-3">
                  <event.icon className="h-5 w-5 text-primary" />
                  <div className='flex-1'>
                    <p className="font-semibold capitalize">{event.type}</p>
                    <p className="text-sm text-muted-foreground capitalize">{event.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-8">No events logged for this day.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;

