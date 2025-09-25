
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react";

const Help = () => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
          <HelpCircle className="h-8 w-8" />
          <h1 className="text-3xl font-bold font-headline">Help & Support</h1>
      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-lg font-semibold">Dashboard & Calendar</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-2">
            <p>The **Dashboard** is your main overview. It features a large calendar that visualizes all your tracked activities.</p>
            <p>You can switch between **Month**, **Week**, and **Day** views using the controls at the top right of the calendar. Use the arrow buttons to navigate through different time periods, or click "Today" to jump back to the current date.</p>
            <p>In the **Week** and **Day** views, you can hover over a workout entry to reveal **Edit** and **Delete** buttons, allowing you to manage your logged workouts directly from the calendar.</p>
            <p>On the right side of the Dashboard, you'll find the **Streaks Tracker**, which shows your current consistency for key habits.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-lg font-semibold">Daily Trackers</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4">
            <p>The **Daily Trackers** page is where you log your day-to-day activities. It contains several cards for different tracking categories.</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>**Medication**: Toggle the switches for your morning and evening doses. You can also adjust the default times for each dose.</li>
                <li>**Water Intake**: Click the buttons for Morning, Afternoon, and Evening to log your 16 oz glasses of water for the day.</li>
                <li>**Mounjaro Shot**: This card shows you when your next injection is due. When it's time, you can set the exact time and log the injection. You can configure your start date and frequency in the tracker's settings.</li>
                <li>**Weekly Workouts**: Log your treadmill and resistance training sessions here. Click the "Log Session" button to open a dialog where you can enter the start and end times for your workout. Your progress towards your weekly goal is shown on the progress bar.</li>
                 <li>**Mood Tracker**: Select an icon that best represents your current mood. You can optionally add notes to provide more context about how you're feeling.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
         <AccordionItem value="item-3">
          <AccordionTrigger className="text-lg font-semibold">Streaks & Progress</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-2">
             <p>The **Progress** tab provides charts to help you visualize your journey over time.</p>
             <p>**Streaks** are calculated based on consecutive days of completing a task. For medication and water, a day is considered complete only if you log all required entries for that day (both doses for medication, all three glasses for water). For workouts, any workout logged on a given day contributes to the streak.</p>
             <p>The **Weekly Workout Consistency** chart shows how many treadmill and resistance sessions you've completed over the last 7 days.</p>
             <p>The **Water Intake Distribution** chart shows a pie chart of when you typically drink water (morning, afternoon, or evening) over the last 30 days.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-lg font-semibold">AI Features</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-2">
            <p>This app includes powerful AI features to give you deeper insights into your habits.</p>
            <p>**Personalized Insights**: Found on the "Daily Trackers" page, this tool analyzes your recent activity. Click "Generate Insights" to receive AI-powered observations about your trends and potential areas for improvement.</p>
            <p>**Optimal Workout Recommendations**: This card, also on the "Daily Trackers" page, helps you plan your exercise. You can enter your personal preferences (e.g., "I prefer to work out in the evenings") and the AI will suggest an optimal schedule based on your goals and past activity.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
          <AccordionTrigger className="text-lg font-semibold">Settings</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-2">
            <p>The **Settings** page allows you to customize the application to your needs.</p>
            <p>Currently, you can adjust your **Weekly Workout Goals**. Simply enter the number of sessions you aim to complete each week for both treadmill and resistance training, and click "Save Changes". The Workout Tracker will update to reflect these new goals.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Help;
