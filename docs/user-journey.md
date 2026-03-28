# User Journey

## Core Flow

The application now follows a clear 2-stage journey:

1. **Prepare**
2. **Build Your Application**

The goal is to keep the first stage focused on context gathering and make the second stage one continuous workspace for creating, opening, and refining the application.

## Stage 1: Prepare

Purpose:
- Collect the target job description
- Build or paste the user's reusable Work Repository
- Optionally add application questions

User actions:
- Paste a job description or extract it from a URL
- Paste or refine the Work Repository
- Use the repository assistant if needed
- Continue forward only after the required fields are valid

Expected outcome:
- The user has enough context prepared to start building a tailored application

## Stage 2: Build Your Application

Purpose:
- Help the user decide what to create next
- Show what is already ready
- Let the user refine each section without leaving the page

Page structure:
- **Header**: context, save, tracker, and back-to-prepare actions
- **AI Coach card**: suggested prompts plus a direct entry into the chat sidebar
- **Build workspace**: section chooser plus the currently selected result

Section labels:
- **Fit Summary**
- **Resume**
- **Cover Letter**
- **Answers**

Behavior rules:
- The page defaults to **Fit Summary**
- Selecting a ready section opens the saved result instead of regenerating it
- Selecting a missing section generates it and opens it in place
- **Create Everything for Me** only fills in missing sections
- Regeneration happens inside the selected section, not on the main chooser
- The AI Coach is part of the page flow, not a separate product mode

Expected outcome:
- The user stays in one continuous workspace from first generation through refinement

## Navigation Principles

- **Prepare -> Build Your Application** is the main forward move
- **Build Your Application -> Prepare** is a deliberate backward move for editing inputs
- The second stage should feel like one connected workspace, not a handoff between separate tools

## Retrieval-First Principle

When results already exist:

- Open existing results by default
- Reuse existing results during **Create Everything for Me**
- Only regenerate when the user explicitly asks to do so

This protects user trust, lowers unnecessary model usage, and makes the interface feel more predictable.
