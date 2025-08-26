/**
 * Assessment List Component
 * Displays available assessments with filtering and search
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Assessment } from '@/lib/types/dezhoumama';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Target, Users } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import Link from 'next/link';

interface AssessmentListProps {
  courseId?: string;
  showFilters?: boolean;
}

export default function AssessmentList({ 
  courseId, 
  showFilters = true 
}: AssessmentListProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchAssessments();
  }, [courseId, difficultyFilter, sortBy]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
      params.append('isActive', 'true');
      params.append('sortField', sortBy === 'newest' ? 'createdAt' : 'title');
      params.append('sortDirection', sortBy === 'newest' ? 'desc' : 'asc');

      const response = await fetch(`/api/assessments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch assessments');
      
      const data = await response.json();
      setAssessments(data.data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (assessment.description && assessment.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
      case 'beginner':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium':
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'hard':
      case 'advanced':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white"
            />
          </div>
          
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-32 bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="title">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Assessment Cards */}
      {filteredAssessments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-2">No assessments found</div>
          <div className="text-sm text-slate-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'No assessments available'}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => {
            const questions = JSON.parse(assessment.questions as string) || [];
            
            return (
              <Card key={assessment.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-white text-lg">
                        {assessment.title}
                      </CardTitle>
                      {assessment.description && (
                        <p className="text-slate-400 text-sm line-clamp-2">
                          {assessment.description}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(assessment.difficulty)}
                    >
                      {assessment.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Assessment Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{questions.length} questions</span>
                    </div>
                    
                    {assessment.timeLimitMinutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{assessment.timeLimitMinutes} min</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Pass: {assessment.passThreshold}%</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link href={`/assessments/${assessment.id}`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        Take Assessment
                      </Button>
                    </Link>
                    
                    <Link href={`/assessments/${assessment.id}?practice=true`}>
                      <Button 
                        variant="outline"
                        className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                      >
                        Practice
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}