import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adjustColor,
  forceSchemeQuery,
  profiles,
  resolveProfile,
} from '../../../packages/email-preview/src/preview-dark-mode.ts';

test('scheme emulation preserves viewport conditions, lists and negation', () => {
  assert.equal(
    forceSchemeQuery(
      'screen and (prefers-color-scheme: dark) and (max-width: 600px)',
      true,
    ),
    'screen and (min-width: 0px) and (max-width: 600px)',
  );
  assert.equal(
    forceSchemeQuery(
      'not all and (prefers-color-scheme: light), (prefers-color-scheme: dark)',
      true,
    ),
    'not all and (min-width: 999999px), (min-width: 0px)',
  );
  assert.equal(
    forceSchemeQuery('(prefers-color-scheme: dark)', false),
    '(min-width: 999999px)',
  );
});

test('selective adjustment preserves dark surfaces, light text and transparency', () => {
  assert.equal(adjustColor('rgb(20, 20, 20)', true, false), 'rgb(20, 20, 20)');
  assert.equal(
    adjustColor('rgb(240, 240, 240)', false, false),
    'rgb(240, 240, 240)',
  );
  assert.equal(adjustColor('rgba(0, 0, 0, 0)', true, true), 'rgba(0, 0, 0, 0)');
  assert.equal(
    adjustColor('rgba(240, 240, 240, 0.5)', true, false),
    'rgba(15, 15, 15, 0.5)',
  );
  assert.equal(
    adjustColor('rgb(20, 20, 20)', false, false),
    'rgba(235, 235, 235, 1)',
  );
  assert.equal(
    adjustColor('rgb(20, 20, 20)', true, true),
    'rgba(235, 235, 235, 1)',
  );
});

test('Gmail account profiles distinguish the light-only opt-out', () => {
  assert.equal(profiles['gmail-android']!.lightOnly, true);
  assert.equal(profiles['gmail-ios']!.lightOnly, true);
  assert.equal(profiles['gmail-android-other']!.lightOnly, undefined);
  assert.equal(profiles['gmail-ios-other']!.lightOnly, undefined);
});

test('old client URLs select their equivalent grouped profile', () => {
  assert.equal(resolveProfile('apple-ios'), 'apple-macos');
  assert.equal(resolveProfile('outlook-macos'), 'apple-macos');
  assert.equal(resolveProfile('gmail-mobile-web'), 'gmail-web');
  assert.equal(resolveProfile('outlook-classic'), 'gmail-ios-other');
  for (const client of ['outlook-web', 'outlook-ios', 'outlook-android']) {
    assert.equal(resolveProfile(client), 'outlook-new');
  }
  assert.equal(resolveProfile('gmail-android'), 'gmail-android');
  assert.equal(resolveProfile('unknown'), 'apple-macos');
});
