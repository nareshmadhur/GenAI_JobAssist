
'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { CvOutput } from '@/ai/flows/generate-cv';

const MISSING_INFO_PLACEHOLDER = '[Information not found in bio]';
const MISSING_NAME_PLACEHOLDER = '[Name not found in bio]';

const isMissing = (text: string | undefined | null): boolean => {
    if (!text) return true;
    return (
        text.includes(MISSING_INFO_PLACEHOLDER) ||
        text.includes(MISSING_NAME_PLACEHOLDER)
    );
};


Font.register({
  family: 'Inter',
  fonts: [
    {
      src: `https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.ttf`,
      fontWeight: 400,
    },
    {
      src: `https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.ttf`,
      fontWeight: 700,
    },
  ],
});


const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#334155', // slate-700
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020617', // slate-950
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    fontSize: 9,
    color: '#64748b', // slate-500
  },
  contactItem: {
    marginHorizontal: 10,
  },
  separator: {
    marginVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // slate-200
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b', // slate-800
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  job: {
    marginBottom: 15,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  jobDuration: {
    fontSize: 9,
    color: '#64748b',
  },
  jobCompany: {
    fontSize: 10,
    marginBottom: 4,
    color: '#475569',
  },
  responsibilities: {
    paddingLeft: 10,
  },
  responsibility: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  responsibilityText: {
    flex: 1,
  },
  educationEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  educationDegree: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  educationInstitution: {
    fontSize: 10,
    color: '#475569',
  },
  educationYear: {
    fontSize: 9,
    color: '#64748b',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skill: {
    backgroundColor: '#f1f5f9', // slate-100
    color: '#334155', // slate-700
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 9,
    marginRight: 6,
    marginBottom: 6,
  },
});

export const CvPdfDocument = ({ cvData }: { cvData: CvOutput }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        {!isMissing(cvData.fullName) && (
            <Text style={styles.fullName}>{cvData.fullName}</Text>
        )}
        <View style={styles.contactInfo}>
            {!isMissing(cvData.email) && (
                <Text style={styles.contactItem}>{cvData.email}</Text>
            )}
             {!isMissing(cvData.phone) && (
                <Text style={styles.contactItem}>{cvData.phone}</Text>
            )}
            {!isMissing(cvData.location) && (
                <Text style={styles.contactItem}>{cvData.location}</Text>
            )}
        </View>
      </View>

      <View style={styles.separator} />

      {/* Summary */}
      {!isMissing(cvData.summary) && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{cvData.summary}</Text>
        </View>
      )}

      {/* Work Experience */}
      {cvData.workExperience.length > 0 && <View style={styles.separator} />}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Experience</Text>
        {cvData.workExperience.filter(exp => !isMissing(exp.jobTitle) && !isMissing(exp.company)).map((job, index) => (
          <View key={index} style={styles.job}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle}>{job.jobTitle}</Text>
              {!isMissing(job.duration) && <Text style={styles.jobDuration}>{job.duration}</Text>}
            </View>
            <Text style={styles.jobCompany}>{job.company}</Text>
            <View style={styles.responsibilities}>
              {job.responsibilities.filter(resp => !isMissing(resp)).map((resp, i) => (
                <View key={i} style={styles.responsibility}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.responsibilityText}>{resp}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Education */}
      {cvData.education.length > 0 && <View style={styles.separator} />}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {cvData.education.filter(edu => !isMissing(edu.degree) && !isMissing(edu.institution)).map((edu, index) => (
          <View key={index} style={styles.educationEntry}>
            <View>
              <Text style={styles.educationDegree}>{edu.degree}</Text>
              <Text style={styles.educationInstitution}>{edu.institution}</Text>
            </View>
            {!isMissing(edu.year) && <Text style={styles.educationYear}>{edu.year}</Text>}
          </View>
        ))}
      </View>

      {/* Skills */}
      {cvData.skills.length > 0 && <View style={styles.separator} />}
       <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsContainer}>
          {cvData.skills.filter(skill => !isMissing(skill)).map((skill, index) => (
            <Text key={index} style={styles.skill}>
              {skill}
            </Text>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);
