import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeEligibleBadges,
  evaluateQuizAnswers,
  formatDuration,
  formatReadableDuration,
} from './quizLogic';

test('evaluateQuizAnswers calculates perfect score, XP, and Quiz Master badge', () => {
  const result = evaluateQuizAnswers(
    [
      { id: 'q1', correctAnswer: 0, points: 20, explanation: 'Benar A' },
      { id: 'q2', correctAnswer: 2, points: 20, explanation: 'Benar C' },
      { id: 'q3', correctAnswer: 1, points: 20, explanation: 'Benar B' },
    ],
    { q1: 0, q2: 2, q3: 1 },
    0
  );

  assert.equal(result.score, 100);
  assert.equal(result.percentage, 100);
  assert.equal(result.correctCount, 3);
  assert.equal(result.wrongCount, 0);
  assert.equal(result.totalQuestions, 3);
  // 25 participation + 3*15 accuracy + 50 mastery bonus = 120 XP
  assert.equal(result.xpEarned, 120);
  assert.ok(result.earnedBadges.includes('Pemula'));
  assert.ok(result.earnedBadges.includes('Quiz Master'));
});

test('evaluateQuizAnswers handles partial and unanswered questions accurately', () => {
  const result = evaluateQuizAnswers(
    [
      { id: 'q1', correctAnswer: 0, points: 20 },
      { id: 'q2', correctAnswer: 1, points: 20 },
      { id: 'q3', correctAnswer: 2, points: 20 },
      { id: 'q4', correctAnswer: 3, points: 20 },
    ],
    { q1: 0, q2: 3, q3: null },
    200
  );

  assert.equal(result.correctCount, 1);
  assert.equal(result.wrongCount, 3);
  assert.equal(result.score, 25);
  // 25 + 15 = 40 XP -> total 240 XP (< 250)
  assert.equal(result.xpEarned, 40);
  assert.ok(!result.earnedBadges.includes('Rajin Belajar'));
});

test('computeEligibleBadges awards progressive milestones', () => {
  const badges = computeEligibleBadges({
    totalXp: 1050,
    latestScore: 90,
    completedQuizzesIncrement: 1,
  });

  assert.deepEqual(badges.sort(), [
    'Juara Kelas',
    'Pancasila Hebat',
    'Pemula',
    'Rajin Belajar',
  ]);
});

test('formatDuration and formatReadableDuration format seconds cleanly', () => {
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatReadableDuration(45), '45 detik');
  assert.equal(formatReadableDuration(120), '2 menit');
  assert.equal(formatReadableDuration(125), '2 menit 5 detik');
});
