import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Leaf } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-8 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Leaf className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold font-headline text-foreground">
          WellTrack Daily
        </h1>
      </div>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </header>
  );
}
