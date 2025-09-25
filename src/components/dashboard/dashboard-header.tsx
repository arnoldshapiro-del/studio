import Image from 'next/image';
import data from '@/lib/placeholder-images.json';

const DashboardHeader = () => {
  const { imageUrl, imageHint } = data.placeholderImages.find(img => img.id === 'hero-background')!;

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden">
      <Image
        src={imageUrl}
        alt="Calm nature background"
        fill
        className="object-cover"
        data-ai-hint={imageHint}
        priority
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex flex-col justify-center items-start p-8">
        <h2 className="font-headline text-3xl font-bold text-white">
          Welcome Back!
        </h2>
        <p className="text-lg text-white/90 mt-1">
          Here's your daily wellness overview.
        </p>
      </div>
    </div>
  );
};

export default DashboardHeader;
