'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Trophy, 
  Plus, 
  Search,
  Filter,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Crown,
  Target,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SocialState, Challenge, CommunityPost, Friend } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { VoiceButton } from '@/components/ui/voice-button';
import { VoiceCommand } from '@/lib/voice-commands';
import { format, isToday, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CommunityHubProps {
  socialData: SocialState;
  userDocRef: DocumentReference | null;
}

// Mock data for demonstration
const DEMO_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: '30-Day Water Challenge',
    description: 'Drink your daily water goal for 30 consecutive days',
    type: 'water',
    target: 30,
    unit: 'days',
    duration: 30,
    startDate: new Date().toISOString(),
    endDate: addDays(new Date(), 30).toISOString(),
    participants: ['user1', 'user2', 'user3'],
    leaderboard: [
      { userId: 'user1', name: 'Sarah M.', progress: 15 },
      { userId: 'user2', name: 'Mike D.', progress: 12 },
      { userId: 'user3', name: 'Emma K.', progress: 8 },
    ],
    isPublic: true,
    createdBy: 'admin',
  },
  {
    id: '2',
    title: 'Weekly Workout Warriors',
    description: 'Complete 5 workouts this week',
    type: 'workout',
    target: 5,
    unit: 'workouts',
    duration: 7,
    startDate: new Date().toISOString(),
    endDate: addDays(new Date(), 7).toISOString(),
    participants: ['user1', 'user4', 'user5'],
    leaderboard: [
      { userId: 'user4', name: 'John R.', progress: 4 },
      { userId: 'user1', name: 'Sarah M.', progress: 3 },
      { userId: 'user5', name: 'Lisa T.', progress: 2 },
    ],
    isPublic: true,
    createdBy: 'user4',
    prize: '🏆 Winner gets a fitness tracker!'
  }
];

const DEMO_POSTS: CommunityPost[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Sarah Mitchell',
    userAvatar: '',
    content: 'Just completed my first month of consistent medication tracking! 💊 The voice logging feature has been a game-changer. Thanks WellTrack team!',
    type: 'success_story',
    tags: ['medication', 'consistency', 'milestone'],
    likes: ['user2', 'user3'],
    comments: [
      {
        id: 'c1',
        userId: 'user2',
        userName: 'Mike Davis',
        content: 'Congratulations Sarah! That\'s amazing consistency 👏',
        timestamp: new Date().toISOString(),
      }
    ],
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'expert1',
    userName: 'Dr. Amanda Rodriguez',
    userAvatar: '',
    content: 'Tip Tuesday: Did you know that tracking your sleep environment can improve sleep quality by 40%? Try logging room temperature and noise levels in the sleep tracker! 🌙',
    type: 'tip',
    tags: ['sleep', 'expert-tip', 'environment'],
    likes: ['user1', 'user2', 'user3', 'user4'],
    comments: [],
    timestamp: new Date().toISOString(),
    isExpert: true,
  }
];

const CommunityHub = ({ socialData, userDocRef }: CommunityHubProps) => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('challenges');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Form states
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeType, setChallengeType] = useState<'workout' | 'water' | 'sleep' | 'steps' | 'meditation' | 'streak'>('workout');
  const [challengeTarget, setChallengeTarget] = useState('');
  const [challengeDuration, setChallengeDuration] = useState('7');
  
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'success_story' | 'question' | 'motivation' | 'tip'>('success_story');

  const handleCreateChallenge = async () => {
    if (!userDocRef || !challengeTitle.trim()) return;

    const newChallenge: Challenge = {
      id: Date.now().toString(),
      title: challengeTitle,
      description: challengeDescription,
      type: challengeType,
      target: parseInt(challengeTarget) || 1,
      unit: challengeType === 'workout' ? 'workouts' : challengeType === 'steps' ? 'steps' : 'days',
      duration: parseInt(challengeDuration),
      startDate: new Date().toISOString(),
      endDate: addDays(new Date(), parseInt(challengeDuration)).toISOString(),
      participants: ['current-user'],
      leaderboard: [{ userId: 'current-user', name: socialData.profile.displayName, progress: 0 }],
      isPublic: true,
      createdBy: 'current-user',
    };

    try {
      await setDocumentNonBlocking(userDocRef, {
        social: {
          ...socialData,
          challenges: [...socialData.challenges, newChallenge]
        }
      }, { merge: true });

      toast({
        title: 'Challenge Created!',
        description: `"${challengeTitle}" is now live for ${challengeDuration} days`,
      });

      // Reset form
      setChallengeTitle('');
      setChallengeDescription('');
      setChallengeTarget('');
      setShowCreateChallenge(false);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Challenge',
        description: 'Please try again.',
      });
    }
  };

  const handleCreatePost = async () => {
    if (!userDocRef || !postContent.trim()) return;

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: socialData.profile.displayName,
      userAvatar: socialData.profile.avatar,
      content: postContent,
      type: postType,
      tags: [],
      likes: [],
      comments: [],
      timestamp: new Date().toISOString(),
    };

    try {
      await setDocumentNonBlocking(userDocRef, {
        social: {
          ...socialData,
          communityPosts: [...socialData.communityPosts, newPost]
        }
      }, { merge: true });

      toast({
        title: 'Post Shared!',
        description: 'Your post has been added to the community feed',
      });

      // Reset form
      setPostContent('');
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Post',
        description: 'Please try again.',
      });
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    // Mock function for demo
    toast({
      title: 'Challenge Joined!',
      description: 'You\'re now part of this challenge. Good luck!',
    });
  };

  const handleLikePost = async (postId: string) => {
    // Mock function for demo
    toast({
      title: 'Post Liked!',
      description: 'Your support has been shared with the community',
    });
  };

  const getChallengeStatusBadge = (challenge: Challenge) => {
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysLeft < 0) return <Badge variant="secondary">Completed</Badge>;
    if (daysLeft === 0) return <Badge variant="destructive">Last Day</Badge>;
    if (daysLeft <= 3) return <Badge variant="outline">{daysLeft} days left</Badge>;
    return <Badge>{daysLeft} days left</Badge>;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'workout': return 'text-blue-500';
      case 'water': return 'text-cyan-500';
      case 'sleep': return 'text-purple-500';
      case 'steps': return 'text-green-500';
      case 'meditation': return 'text-indigo-500';
      default: return 'text-gray-500';
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'success_story': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'question': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'motivation': return <Heart className="w-4 h-4 text-red-500" />;
      case 'tip': return <Target className="w-4 h-4 text-green-500" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  // Use demo data for display
  const displayChallenges = [...DEMO_CHALLENGES, ...socialData.challenges];
  const displayPosts = [...DEMO_POSTS, ...socialData.communityPosts];

  return (
    <div className="space-y-6">
      {/* Community Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Users className="text-primary" />
            Community Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{displayChallenges.length}</div>
              <div className="text-sm text-muted-foreground">Active Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{socialData.friends.length}</div>
              <div className="text-sm text-muted-foreground">Friends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{socialData.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{socialData.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Hub Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Community
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Challenges</CardTitle>
              <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Challenge</DialogTitle>
                    <DialogDescription>
                      Create a challenge to motivate yourself and others
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Challenge Title</Label>
                      <Input
                        placeholder="e.g., 7-Day Workout Streak"
                        value={challengeTitle}
                        onChange={(e) => setChallengeTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe your challenge..."
                        value={challengeDescription}
                        onChange={(e) => setChallengeDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select value={challengeType} onValueChange={(value: any) => setChallengeType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workout">Workout</SelectItem>
                            <SelectItem value="water">Water</SelectItem>
                            <SelectItem value="sleep">Sleep</SelectItem>
                            <SelectItem value="steps">Steps</SelectItem>
                            <SelectItem value="meditation">Meditation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Target</Label>
                        <Input
                          type="number"
                          placeholder="5"
                          value={challengeTarget}
                          onChange={(e) => setChallengeTarget(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Duration (days)</Label>
                      <Select value={challengeDuration} onValueChange={setChallengeDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="7">1 Week</SelectItem>
                          <SelectItem value="14">2 Weeks</SelectItem>
                          <SelectItem value="30">1 Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateChallenge}>Create Challenge</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayChallenges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active challenges.</p>
                  <p className="text-sm">Create one to get started!</p>
                </div>
              ) : (
                displayChallenges.map((challenge) => (
                  <Card key={challenge.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{challenge.title}</h3>
                            {getChallengeStatusBadge(challenge)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className={cn("flex items-center gap-1", getTypeColor(challenge.type))}>
                              <Target className="w-3 h-3" />
                              {challenge.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {challenge.participants.length} participants
                            </span>
                            {challenge.prize && (
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                Prize available
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleJoinChallenge(challenge.id)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join
                        </Button>
                      </div>
                      
                      {/* Leaderboard */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Top Performers</h4>
                        {challenge.leaderboard.slice(0, 3).map((entry, index) => (
                          <div key={entry.userId} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", 
                                index === 0 ? "bg-yellow-500 text-white" :
                                index === 1 ? "bg-gray-400 text-white" :
                                "bg-orange-400 text-white"
                              )}>
                                {index + 1}
                              </span>
                              <span>{entry.name}</span>
                            </div>
                            <span className="font-medium">{entry.progress}/{challenge.target}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Friends & Connections</CardTitle>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friends
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Connect with friends to stay motivated!</p>
                <p className="text-sm">Share achievements and support each other's health journey.</p>
                <Button className="mt-4" variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Find Friends
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Community Feed</CardTitle>
              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Share Post
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share with Community</DialogTitle>
                    <DialogDescription>
                      Share your success, ask questions, or motivate others
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Post Type</Label>
                      <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="success_story">Success Story</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="motivation">Motivation</SelectItem>
                          <SelectItem value="tip">Tip</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Content</Label>
                      <Textarea
                        placeholder="Share your thoughts..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreatePost}>Share Post</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No community posts yet.</p>
                  <p className="text-sm">Be the first to share your story!</p>
                </div>
              ) : (
                displayPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={post.userAvatar} />
                          <AvatarFallback>{post.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{post.userName}</span>
                            {post.isExpert && (
                              <Badge variant="secondary" className="text-xs">
                                Expert
                              </Badge>
                            )}
                            {getPostTypeIcon(post.type)}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(post.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm mb-3">{post.content}</p>
                          
                          {/* Post tags */}
                          {post.tags.length > 0 && (
                            <div className="flex gap-1 mb-3">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Post actions */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <button 
                              className="flex items-center gap-1 hover:text-red-500 transition-colors"
                              onClick={() => handleLikePost(post.id)}
                            >
                              <Heart className="w-4 h-4" />
                              {post.likes.length}
                            </button>
                            <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                              {post.comments.length}
                            </button>
                            <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Global Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Leaderboards coming soon!</p>
                <p className="text-sm">Compete with users worldwide and climb the rankings.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityHub;