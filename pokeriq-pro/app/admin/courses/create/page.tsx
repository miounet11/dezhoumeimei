/**
 * Admin Course Creation Page
 * Multi-step wizard for creating new courses
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminPage } from '@/components/admin/AdminLayout';

interface CourseFormData {
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationMinutes: number;
  tags: string[];
  prerequisites: string[];
  contentPath: string;
  videoUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
}

interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    level: 'BEGINNER',
    durationMinutes: 60,
    tags: [],
    prerequisites: [],
    contentPath: '',
    videoUrl: '',
    thumbnailUrl: '',
    isActive: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const steps: Step[] = [
    { id: 1, title: 'Basic Information', description: 'Course title, description, and level', completed: false },
    { id: 2, title: 'Content & Media', description: 'Video, content files, and thumbnails', completed: false },
    { id: 3, title: 'Configuration', description: 'Prerequisites, tags, and settings', completed: false },
    { id: 4, title: 'Review & Publish', description: 'Final review and publication options', completed: false }
  ];

  const updateFormData = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Course title is required';
        if (!formData.description.trim()) newErrors.description = 'Course description is required';
        if (formData.durationMinutes <= 0) newErrors.durationMinutes = 'Duration must be greater than 0';
        break;
      
      case 2:
        // Content and media validation (optional for now)
        break;
      
      case 3:
        // Configuration validation (optional for now)
        break;
      
      case 4:
        // Final validation
        if (!formData.title.trim()) newErrors.title = 'Course title is required';
        if (!formData.description.trim()) newErrors.description = 'Course description is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setSaving(true);
    try {
      // In production, call API:
      // const response = await fetch('/api/admin/courses', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Creating course:', formData);
      
      // Redirect to courses list on success
      router.push('/admin/courses');
    } catch (error) {
      console.error('Failed to create course:', error);
      setErrors({ submit: 'Failed to create course. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter course title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe what students will learn in this course"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Level *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => updateFormData('level', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => updateFormData('durationMinutes', parseInt(e.target.value) || 0)}
                  min="1"
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.durationMinutes ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.durationMinutes && <p className="mt-1 text-sm text-red-600">{errors.durationMinutes}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Content & Media</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Video URL
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => updateFormData('videoUrl', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/video.mp4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Image URL
              </label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => updateFormData('thumbnailUrl', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Path
              </label>
              <input
                type="text"
                value={formData.contentPath}
                onChange={(e) => updateFormData('contentPath', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="/content/courses/course-name.md"
              />
              <p className="mt-1 text-sm text-gray-500">
                Path to the course content file (Markdown or JSON)
              </p>
            </div>

            {/* File upload area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl">📁</div>
                <p className="text-gray-600">Upload course materials</p>
                <p className="text-sm text-gray-500">
                  Drag and drop files here or click to browse
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Choose Files
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add tags (press Enter)"
                />
                <button
                  onClick={handleAddTag}
                  type="button"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prerequisites
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Select courses that students must complete before taking this course
              </p>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600">No prerequisites selected</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                  + Add Prerequisites
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => updateFormData('isActive', e.target.checked)}
                  className="rounded border-gray-300 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Publish course immediately
                </span>
              </label>
              <p className="text-sm text-gray-500 ml-6">
                If unchecked, the course will be saved as a draft
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Publish</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Course Summary</h4>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-700">Basic Information</h5>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Title:</strong> {formData.title}</p>
                    <p><strong>Level:</strong> {formData.level}</p>
                    <p><strong>Duration:</strong> {formData.durationMinutes} minutes</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700">Configuration</h5>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Tags:</strong> {formData.tags.join(', ') || 'None'}</p>
                    <p><strong>Status:</strong> {formData.isActive ? 'Active' : 'Draft'}</p>
                    <p><strong>Prerequisites:</strong> {formData.prerequisites.length || 'None'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700">Description</h5>
                <p className="mt-1 text-sm text-gray-600">{formData.description}</p>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{errors.submit}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminPage>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/courses" className="hover:text-gray-700">Courses</Link>
            <span>→</span>
            <span>Create New Course</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600">Follow the steps to create a comprehensive learning course</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep === step.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : currentStep > step.id
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    currentStep === step.id ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`ml-6 mr-6 h-0.5 w-16 ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center space-x-4">
            <Link
              href="/admin/courses"
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Link>
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Course'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}