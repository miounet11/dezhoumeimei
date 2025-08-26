/**
 * Admin Assessment Creation Page
 * Interactive assessment builder with question authoring tools
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminPage } from '@/components/admin/AdminLayout';

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'scenario';
  question: string;
  explanation?: string;
  options: string[];
  correctAnswer: string | number;
  points: number;
  image?: string;
}

interface AssessmentFormData {
  courseId: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  passThreshold: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  isActive: boolean;
  questions: Question[];
  scoringConfig: {
    pointsPerQuestion: number;
    timeBonus: boolean;
    negativeScoring: boolean;
  };
}

const mockCourses = [
  { id: '1', title: 'Poker Fundamentals', level: 'BEGINNER' },
  { id: '2', title: 'GTO Strategy Basics', level: 'INTERMEDIATE' },
  { id: '3', title: 'Tournament Psychology', level: 'ADVANCED' },
];

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AssessmentFormData>({
    courseId: '',
    title: '',
    description: '',
    difficulty: 'BEGINNER',
    passThreshold: 70,
    timeLimitMinutes: null,
    maxAttempts: 3,
    isActive: false,
    questions: [],
    scoringConfig: {
      pointsPerQuestion: 1,
      timeBonus: false,
      negativeScoring: false
    }
  });
  
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    type: 'multiple_choice',
    question: '',
    explanation: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1,
    image: ''
  });
  
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const updateFormData = (field: keyof AssessmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateCurrentQuestion = (field: keyof Question, value: any) => {
    setCurrentQuestion(prev => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    if (currentQuestion.options.length < 6) {
      updateCurrentQuestion('options', [...currentQuestion.options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index);
      updateCurrentQuestion('options', newOptions);
      
      // Adjust correct answer if needed
      if (typeof currentQuestion.correctAnswer === 'number' && currentQuestion.correctAnswer >= newOptions.length) {
        updateCurrentQuestion('correctAnswer', 0);
      }
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    updateCurrentQuestion('options', newOptions);
  };

  const validateQuestion = (): boolean => {
    const questionErrors: Record<string, string> = {};

    if (!currentQuestion.question.trim()) {
      questionErrors.question = 'Question text is required';
    }

    if (currentQuestion.type === 'multiple_choice') {
      const validOptions = currentQuestion.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        questionErrors.options = 'At least 2 options are required';
      }
      
      if (!currentQuestion.options[currentQuestion.correctAnswer as number]?.trim()) {
        questionErrors.correctAnswer = 'Please select a valid correct answer';
      }
    }

    setErrors(questionErrors);
    return Object.keys(questionErrors).length === 0;
  };

  const saveQuestion = () => {
    if (!validateQuestion()) return;

    const questionToSave = {
      ...currentQuestion,
      id: editingQuestionIndex !== null ? currentQuestion.id : `q_${Date.now()}`,
      options: currentQuestion.options.filter(opt => opt.trim()) // Remove empty options
    };

    let updatedQuestions = [...formData.questions];
    
    if (editingQuestionIndex !== null) {
      updatedQuestions[editingQuestionIndex] = questionToSave;
    } else {
      updatedQuestions.push(questionToSave);
    }

    updateFormData('questions', updatedQuestions);
    resetQuestionEditor();
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion({...formData.questions[index]});
    setEditingQuestionIndex(index);
    setShowQuestionEditor(true);
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    updateFormData('questions', updatedQuestions);
  };

  const resetQuestionEditor = () => {
    setCurrentQuestion({
      id: '',
      type: 'multiple_choice',
      question: '',
      explanation: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      image: ''
    });
    setEditingQuestionIndex(null);
    setShowQuestionEditor(false);
    setErrors({});
  };

  const handleSubmit = async () => {
    // Validate assessment
    const assessmentErrors: Record<string, string> = {};
    
    if (!formData.courseId) assessmentErrors.courseId = 'Course selection is required';
    if (!formData.title.trim()) assessmentErrors.title = 'Assessment title is required';
    if (formData.questions.length === 0) assessmentErrors.questions = 'At least one question is required';
    
    if (Object.keys(assessmentErrors).length > 0) {
      setErrors(assessmentErrors);
      return;
    }

    setSaving(true);
    try {
      // In production, call API
      console.log('Creating assessment:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/admin/assessments');
    } catch (error) {
      console.error('Failed to create assessment:', error);
      setErrors({ submit: 'Failed to create assessment. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const renderQuestionPreview = (question: Question, index: number) => (
    <div key={question.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {question.type.replace('_', ' ')}
            </span>
            <span className="text-sm text-gray-500">
              {question.points} {question.points === 1 ? 'point' : 'points'}
            </span>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">
            Q{index + 1}: {question.question}
          </h4>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => editQuestion(index)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => deleteQuestion(index)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.options.map((option, optIndex) => (
            <div key={optIndex} className="flex items-center">
              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs mr-3 ${
                optIndex === question.correctAnswer
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'border-gray-300'
              }`}>
                {String.fromCharCode(65 + optIndex)}
              </span>
              <span className={`text-sm ${
                optIndex === question.correctAnswer ? 'font-medium text-gray-900' : 'text-gray-700'
              }`}>
                {option}
              </span>
              {optIndex === question.correctAnswer && (
                <span className="ml-2 text-green-600 text-xs">✓ Correct</span>
              )}
            </div>
          ))}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${
            question.correctAnswer === 'true' ? 'font-medium text-green-600' : 'text-gray-600'
          }`}>
            <span className="mr-2">✓</span>True
          </div>
          <div className={`flex items-center ${
            question.correctAnswer === 'false' ? 'font-medium text-green-600' : 'text-gray-600'
          }`}>
            <span className="mr-2">✗</span>False
          </div>
        </div>
      )}

      {question.explanation && (
        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Explanation:</strong> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <AdminPage>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/assessments" className="hover:text-gray-700">Assessments</Link>
            <span>→</span>
            <span>Create New Assessment</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Assessment</h1>
          <p className="text-gray-600">Build interactive quizzes and assessments for your courses</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => updateFormData('courseId', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.courseId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a course</option>
                    {mockCourses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {errors.courseId && <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => updateFormData('difficulty', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter assessment title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the assessment goals and content"
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                  <p className="text-sm text-gray-500">
                    {formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''} added
                  </p>
                </div>
                <button
                  onClick={() => setShowQuestionEditor(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Add Question</span>
                </button>
              </div>

              {errors.questions && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{errors.questions}</p>
                </div>
              )}

              <div className="space-y-4">
                {formData.questions.map(renderQuestionPreview)}
                
                {formData.questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No questions added yet</p>
                    <p className="text-sm">Click "Add Question" to start building your assessment</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Assessment Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pass Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passThreshold}
                    onChange={(e) => updateFormData('passThreshold', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.timeLimitMinutes || ''}
                    onChange={(e) => updateFormData('timeLimitMinutes', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxAttempts}
                    onChange={(e) => updateFormData('maxAttempts', parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                      Publish immediately
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={saving || formData.questions.length === 0}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Creating...' : 'Create Assessment'}
              </button>
              
              <Link
                href="/admin/assessments"
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center block"
              >
                Cancel
              </Link>
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>
        </div>

        {/* Question Editor Modal */}
        {showQuestionEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={currentQuestion.type}
                    onChange={(e) => updateCurrentQuestion('type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="scenario">Scenario Based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text *
                  </label>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e) => updateCurrentQuestion('question', e.target.value)}
                    rows={3}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.question ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your question here"
                  />
                  {errors.question && <p className="mt-1 text-sm text-red-600">{errors.question}</p>}
                </div>

                {currentQuestion.type === 'multiple_choice' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Answer Options *
                      </label>
                      <button
                        onClick={addOption}
                        disabled={currentQuestion.options.length >= 6}
                        className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                      >
                        + Add Option
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={currentQuestion.correctAnswer === index}
                            onChange={() => updateCurrentQuestion('correctAnswer', index)}
                            className="text-blue-600"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {currentQuestion.options.length > 2 && (
                            <button
                              onClick={() => removeOption(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.options && <p className="mt-1 text-sm text-red-600">{errors.options}</p>}
                    {errors.correctAnswer && <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>}
                  </div>
                )}

                {currentQuestion.type === 'true_false' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer *
                    </label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="trueFalseAnswer"
                          value="true"
                          checked={currentQuestion.correctAnswer === 'true'}
                          onChange={(e) => updateCurrentQuestion('correctAnswer', e.target.value)}
                          className="mr-2"
                        />
                        True
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="trueFalseAnswer"
                          value="false"
                          checked={currentQuestion.correctAnswer === 'false'}
                          onChange={(e) => updateCurrentQuestion('correctAnswer', e.target.value)}
                          className="mr-2"
                        />
                        False
                      </label>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentQuestion.points}
                      onChange={(e) => updateCurrentQuestion('points', parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL (optional)
                    </label>
                    <input
                      type="url"
                      value={currentQuestion.image}
                      onChange={(e) => updateCurrentQuestion('image', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={currentQuestion.explanation}
                    onChange={(e) => updateCurrentQuestion('explanation', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this is the correct answer"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t flex items-center justify-end space-x-3">
                <button
                  onClick={resetQuestionEditor}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveQuestion}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPage>
  );
}