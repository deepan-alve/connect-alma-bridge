/**
 * Resume Parser Utility
 * Uses OpenResume's actual parsing library (https://github.com/xitanggg/open-resume)
 */

import { readPdf } from '../lib/parse-resume-from-pdf/read-pdf';
import { groupTextItemsIntoLines } from '../lib/parse-resume-from-pdf/group-text-items-into-lines';
import { groupLinesIntoSections } from '../lib/parse-resume-from-pdf/group-lines-into-sections';
import { extractResumeFromSections } from '../lib/parse-resume-from-pdf/extract-resume-from-sections';
import type { ResumeWorkExperience, ResumeEducation } from '../lib/parse-resume-from-pdf/resume-types';

export interface ParsedResume {
  experiences: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expirationDate?: string;
  }>;
  skills: string[]; // Array of skill descriptions
}

/**
 * Parse date range string into start and end dates
 * Examples: "Aug 2024 — July 2028", "2020 - 2024", "Jan 2023 - Present"
 */
function parseDateRange(dateStr: string): { startDate: string; endDate: string } {
  if (!dateStr) return { startDate: '', endDate: '' };

  // Common separators: —, -, –, to
  const separators = ['—', '–', '-', ' to ', ' To ', ' TO '];
  let parts: string[] = [];
  
  for (const sep of separators) {
    if (dateStr.includes(sep)) {
      parts = dateStr.split(sep).map(p => p.trim());
      break;
    }
  }

  if (parts.length === 0) {
    // No separator found, treat as single date
    return { startDate: normalizeDate(dateStr.trim()), endDate: '' };
  }

  const startDate = normalizeDate(parts[0] || '');
  const endDate = parts[1] ? normalizeDate(parts[1]) : '';

  return { startDate, endDate };
}

/**
 * Normalize date to YYYY-MM-DD format or keep as-is if already valid
 * Examples: "Aug 2024" -> "2024-08-01", "2024" -> "2024-01-01", "Present" -> "Present"
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Check if it's "Present", "Current", etc.
  if (dateStr.match(/present|current|now/i)) {
    return 'Present';
  }

  // Check if already in YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }

  // Month name to number mapping
  const months: { [key: string]: string } = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09', sept: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  // Try to parse "Month YYYY" format (e.g., "Aug 2024", "August 2024")
  const monthYearMatch = dateStr.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase();
    const year = monthYearMatch[2];
    const monthNum = months[monthName];
    if (monthNum) {
      return `${year}-${monthNum}-01`;
    }
  }

  // Try to parse just year "YYYY"
  const yearMatch = dateStr.match(/^\d{4}$/);
  if (yearMatch) {
    return `${dateStr}-01-01`;
  }

  // Try to parse "MM/YYYY" format
  const mmYyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyyMatch) {
    const month = mmYyyyMatch[1].padStart(2, '0');
    const year = mmYyyyMatch[2];
    return `${year}-${month}-01`;
  }

  // If we can't parse it, return empty string (will be converted to null by frontend)
  console.warn(`Could not normalize date: "${dateStr}"`);
  return '';
}

/**
 * Parse resume from PDF buffer using OpenResume's algorithm
 */
export async function parseResumeFromPDF(pdfBuffer: Buffer): Promise<ParsedResume> {
  try {
    // Convert buffer to Uint8Array for pdfjs
    const uint8Array = new Uint8Array(pdfBuffer);

    // Use OpenResume's parsing pipeline with buffer data
    const textItems = await readPdf(uint8Array);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const resume = extractResumeFromSections(sections);

    // Transform OpenResume format to our format
    const experiences = resume.workExperiences.map((exp: ResumeWorkExperience) => {
      const { startDate, endDate } = parseDateRange(exp.date || '');
      return {
        company: exp.company || '',
        position: exp.jobTitle || '',
        startDate,
        endDate,
        description: exp.descriptions.join('\n')
      };
    });

    const education = resume.educations.map((edu: ResumeEducation) => {
      const { startDate, endDate } = parseDateRange(edu.date || '');
      return {
        institution: edu.school || '',
        degree: edu.degree || '',
        fieldOfStudy: '', // OpenResume doesn't separate this
        startDate,
        endDate
      };
    });

    // OpenResume doesn't have certifications, return empty for now
    const certifications: Array<{
      name: string;
      issuingOrganization: string;
      issueDate: string;
      expirationDate?: string;
    }> = [];

    console.log('=== PARSED RESUME (OpenResume) ===');
    console.log('Experiences:', experiences.length);
    console.log('Education:', education.length);
    console.log('Skills:', resume.skills.descriptions);
    console.log('Profile:', resume.profile);
    console.log('=== END PARSED RESUME ===');

    return {
      experiences,
      education,
      certifications,
      skills: resume.skills.descriptions // Include skills from OpenResume
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error('Failed to parse resume PDF');
  }
}

export default parseResumeFromPDF;
