'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Award, 
  Share2, 
  TrendingUp, 
  Users, 
  Star,
  Medal,
  Crown,
  Target,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import AchievementBadges from './AchievementBadges';
import Leaderboard from './Leaderboard';

interface SocialStats {
  totalAchievementPoints: number;
  achievementProgress: number;
  socialShares: number;
  peersCompared: number;
  insights?: {
    strongestCategory?: any;
    competitiveRank?: string;
    engagementLevel?: string;
    recentAchievements?: any[];
    nextAchievements?: any[];
  };
}

interface SocialFeaturesProps {
  userId: string;
  className?: string;
}

export default function SocialFeatures({ userId, className = '' }: SocialFeaturesProps) {
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard' | 'sharing'>('achievements');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    fetchSocialStats();
  }, [userId]);

  const fetchSocialStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/achievements/${userId}`, {
        method: 'PUT', // Using PUT to get comprehensive social stats
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch social stats: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setSocialStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch social stats');
      }
    } catch (err) {
      console.error('Error fetching social stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load social stats');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform: string, content: any) => {
    try {
      const response = await fetch(`/api/dashboard/achievements/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'share',
          achievementId: content.id,
          platform,
          content
        }),
      });

      if (response.ok) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
        
        // Update social stats to reflect the new share
        fetchSocialStats();
      }
    } catch (err) {
      console.error('Error recording share:', err);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const generateShareContent = () => {
    if (!socialStats) return { url: '', message: '' };

    const achievements = socialStats.totalAchievementPoints;
    const progress = Math.round(socialStats.achievementProgress);
    const rank = socialStats.insights?.competitiveRank || 'Unranked';

    const url = `${window.location.origin}/profile/${userId}`;
    const message = `I've earned ${achievements} achievement points with ${progress}% completion in PokerIQ Pro! Current rank: ${rank}. Check out my progress!`;

    return { url, message };
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-red-600">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold">Failed to Load Social Features</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <button 
            onClick={fetchSocialStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { url: generatedShareUrl, message: generatedShareMessage } = generateShareContent();

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Social Features</h2>
              <p className="text-sm text-gray-500">
                Achievements, leaderboards, and social sharing
              </p>
            </div>
          </div>
          
          {socialStats?.insights?.engagementLevel && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {socialStats.insights.engagementLevel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="p-3 bg-yellow-100 rounded-lg inline-block mb-2">
              <Medal className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {socialStats?.totalAchievementPoints || 0}
            </div>
            <div className="text-sm text-gray-500">Achievement Points</div>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg inline-block mb-2">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(socialStats?.achievementProgress || 0)}%
            </div>
            <div className="text-sm text-gray-500">Progress</div>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg inline-block mb-2">
              <Share2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {socialStats?.socialShares || 0}
            </div>
            <div className="text-sm text-gray-500">Shares</div>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-lg inline-block mb-2">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {socialStats?.insights?.competitiveRank || 'Unranked'}
            </div>
            <div className="text-sm text-gray-500">Rank</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'achievements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Achievements
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'leaderboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Leaderboards
          </button>
          <button
            onClick={() => setActiveTab('sharing')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sharing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            Share Progress
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <AchievementBadges userId={userId} />
            
            {socialStats?.insights?.recentAchievements && socialStats.insights.recentAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Unlocks</h3>
                <div className="space-y-3">
                  {socialStats.insights.recentAchievements.slice(0, 3).map((achievement: any) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <Star className="w-5 h-5 text-yellow-600 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{achievement.name}</div>
                        <div className="text-sm text-gray-500">{achievement.description}</div>
                      </div>
                      <div className="text-xs text-yellow-600 font-medium">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {socialStats?.insights?.nextAchievements && socialStats.insights.nextAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Almost There!</h3>
                <div className="space-y-3">
                  {socialStats.insights.nextAchievements.map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <Target className="w-5 h-5 text-blue-600 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{achievement.name}</div>
                        <div className="text-sm text-gray-500">{achievement.description}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round(achievement.progress * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {Math.round(achievement.progress * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard userId={userId} />
        )}

        {activeTab === 'sharing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Progress</h3>
              <p className="text-gray-600 mb-6">
                Let others know about your achievements and progress in PokerIQ Pro!
              </p>

              <div className="space-y-4">
                {/* Share URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile URL
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={generatedShareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedShareUrl)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Share Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Message
                  </label>
                  <div className="flex">
                    <textarea
                      value={generatedShareMessage}
                      readOnly
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm resize-none"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedShareMessage)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors self-start"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Social Media Share Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Share
                  </label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(generatedShareMessage)}&url=${encodeURIComponent(generatedShareUrl)}`;
                        window.open(tweetUrl, '_blank');
                        handleShare('twitter', { message: generatedShareMessage, url: generatedShareUrl });
                      }}
                      className="flex items-center px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Twitter
                    </button>
                    <button
                      onClick={() => {
                        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generatedShareUrl)}`;
                        window.open(linkedInUrl, '_blank');
                        handleShare('linkedin', { message: generatedShareMessage, url: generatedShareUrl });
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      LinkedIn
                    </button>
                    <button
                      onClick={() => {
                        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedShareUrl)}`;
                        window.open(facebookUrl, '_blank');
                        handleShare('facebook', { message: generatedShareMessage, url: generatedShareUrl });
                      }}
                      className="flex items-center px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Facebook
                    </button>
                  </div>
                </div>
              </div>

              {shareSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center p-3 bg-green-100 border border-green-200 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-green-800">Copied to clipboard!</span>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}