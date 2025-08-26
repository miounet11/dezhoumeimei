/**
 * Confirm Submission Dialog
 * Shows confirmation dialog before submitting assessment
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Loading from '@/components/ui/Loading';

interface ConfirmSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  answeredQuestions: number;
  totalQuestions: number;
  isPracticeMode: boolean;
}

export default function ConfirmSubmissionDialog({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  answeredQuestions,
  totalQuestions,
  isPracticeMode
}: ConfirmSubmissionDialogProps) {
  const isComplete = answeredQuestions === totalQuestions;
  const unanswered = totalQuestions - answeredQuestions;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
            Submit {isPracticeMode ? 'Practice' : 'Assessment'}?
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            {isComplete ? (
              <>
                You have answered all {totalQuestions} questions. 
                {isPracticeMode 
                  ? ' Review your answers and explanations after submission.'
                  : ' This action cannot be undone.'
                }
              </>
            ) : (
              <>
                You have answered {answeredQuestions} out of {totalQuestions} questions. 
                {unanswered} question{unanswered !== 1 ? 's are' : ' is'} still unanswered.
                {!isPracticeMode && ' Unanswered questions will be marked as incorrect.'}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Answered:</span>
              <span className="text-green-300">{answeredQuestions}/{totalQuestions}</span>
            </div>
            
            {!isComplete && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Unanswered:</span>
                <span className="text-yellow-300">{unanswered}</span>
              </div>
            )}

            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full transition-all"
                style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            variant="outline"
            className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
          >
            Continue Working
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`${
              isComplete
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
            } text-white`}
          >
            {isSubmitting ? (
              <>
                <Loading className="w-4 h-4 mr-2" />
                Submitting...
              </>
            ) : (
              `Submit ${isPracticeMode ? 'Practice' : 'Now'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}