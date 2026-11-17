import { describe, expect, it } from 'vitest';
import { classLength, durationLabel, linkPlatform, meetingLink } from './meetings';

describe('class length', () => {
  it('is calculated from the start and end times', () => {
    expect(classLength('10:00', '11:00')).toEqual({ minutes: 60, nextDay: false });
    expect(classLength('09:15', '10:45')).toEqual({ minutes: 90, nextDay: false });
    expect(classLength('22:00', '23:00')).toEqual({ minutes: 60, nextDay: false });
  });

  it('runs past midnight when the end time is at or before the start time', () => {
    expect(classLength('23:30', '00:30')).toEqual({ minutes: 60, nextDay: true });
    expect(classLength('11:00', '10:00')).toEqual({ minutes: 23 * 60, nextDay: true });
    expect(classLength('10:00', '10:00')).toEqual({ minutes: 24 * 60, nextDay: true });
  });

  it('waits for both times', () => {
    expect(classLength('10:00', '')).toBeNull();
    expect(classLength('', '11:00')).toBeNull();
    expect(classLength(undefined, undefined)).toBeNull();
  });

  it('reads as hours and minutes', () => {
    expect(durationLabel(45)).toBe('45 minutes');
    expect(durationLabel(60)).toBe('1 hour');
    expect(durationLabel(90)).toBe('1 hour 30 minutes');
    expect(durationLabel(121)).toBe('2 hours 1 minute');
    expect(durationLabel(480)).toBe('8 hours');
  });
});

describe('meeting links', () => {
  it('recognises Google Meet, Zoom and Microsoft Teams links, as the API does', () => {
    expect(linkPlatform('https://meet.google.com/abc-defg-hij')).toBe('google_meet');
    expect(linkPlatform('https://us02web.zoom.us/j/81234567890?pwd=abc')).toBe('zoom');
    expect(linkPlatform('https://zoom.us/j/81234567890')).toBe('zoom');
    expect(linkPlatform('https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0?context=%7b%7d')).toBe('teams');
    expect(linkPlatform('https://teams.microsoft.com/meet/38228886453881?p=AbCdEf')).toBe('teams');
    expect(linkPlatform('https://teams.live.com/meet/9382888645388?p=mrmk9')).toBe('teams');
    expect(linkPlatform('https://teams.cloud.microsoft/meet/38228886453881?p=AbCdEf')).toBe('teams');
    expect(linkPlatform('https://gov.teams.microsoft.us/l/meetup-join/x')).toBe('teams');
  });

  it('accepts a link pasted without https://', () => {
    expect(linkPlatform('teams.live.com/meet/9382888645388?p=mrmk9')).toBe('teams');
    expect(meetingLink('  teams.live.com/meet/9382888645388?p=mrmk9 ')).toBe('https://teams.live.com/meet/9382888645388?p=mrmk9');
    expect(meetingLink('https://zoom.us/j/1')).toBe('https://zoom.us/j/1');
  });

  it('rejects other sites, look-alike hosts and non-https links', () => {
    for (const link of [
      'https://example.com/meeting',
      'http://meet.google.com/abc-defg-hij',
      'http://teams.microsoft.com/l/meetup-join/x',
      'javascript:alert(1)',
      'https://teams.microsoft.com/',
      'https://teams.microsoft.com.example.com/l/meetup-join/x',
      'https://myteams.live.com/meet/1',
      'https://notzoom.us/j/1',
      'https://user:pw@teams.live.com/meet/1',
    ]) {
      expect(linkPlatform(link), link).toBeNull();
    }
  });
});
