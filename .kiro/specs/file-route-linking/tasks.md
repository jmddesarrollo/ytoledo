# Implementation Plan: File Route Linking

## Overview

Este plan implementa la funcionalidad de vinculación de archivos a rutas siguiendo la arquitectura existente Controller/Service/Model. Las tareas están organizadas para desarrollo incremental, comenzando con la base de datos y backend, seguido por frontend y finalmente integración.

## Tasks

- [ ] 1. Database Schema and Core Backend Setup
  - [ ] 1.1 Add file_track field to routes table
    - Create migration script to add `file_track VARCHAR(255) NULL` to routes table
    - Add index on file_track column for performance
    - _Requirements: 1.1, 1.2_
  
  - [ ] 1.2 Extend Route model with file linking methods
    - Add fileTrack property to Route TypeScript model
    - Implement hasLinkedFile() and getLinkedFileId() methods
    - _Requirements: 1.3_
  
  - [ ] 1.3 Create FileInfo model and repository
    - Create FileInfo TypeScript model with file metadata
    - Implement FileRepository with methods for unlinked files management
    - _Requirements: 5.2, 5.3_

- [ ] 2. File Linking Backend Services
  - [ ] 2.1 Implement FileRouteLinkingService
    - Create service with linkFileToRoute() method
    - Implement unlinkFileFromRoute() method
    - Add getAvailableRoutesForLinking() method
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_
  
  - [ ] 2.2 Extend RouteRepository with file operations
    - Add updateFileTrack() method
    - Implement findRoutesWithoutFiles() method
    - Add findRouteByFileTrack() method
    - _Requirements: 2.2, 3.2_
  
  - [ ] 2.3 Implement unlinked files management
    - Add getUnlinkedFiles() method to FileRouteLinkingService
    - Implement deleteUnlinkedFile() method
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 3. API Endpoints Implementation
  - [ ] 3.1 Create FileRouteController
    - Implement POST /api/files/upload-with-link endpoint
    - Add GET /api/routes/available-for-linking endpoint
    - Create PUT /api/routes/:id/unlink-file endpoint
    - _Requirements: 2.1, 2.3, 2.4, 3.1, 3.2_
  
  - [ ] 3.2 Implement file download endpoint
    - Create GET /api/files/download/:fileId endpoint
    - Add proper headers for file download
    - Implement file serving with correct MIME types
    - _Requirements: 4.4_
  
  - [ ] 3.3 Add unlinked files management endpoint
    - Implement GET /api/files/unlinked endpoint
    - Add DELETE /api/files/unlinked/:fileId endpoint
    - _Requirements: 5.2, 5.4_

- [ ] 4. Checkpoint - Backend Core Complete
  - Ensure all backend services and endpoints work correctly
  - Test database operations and file operations
  - Ask the user if questions arise

- [ ] 5. Frontend Services and Models
  - [ ] 5.1 Create FileRouteLinkingService (Angular)
    - Implement uploadFileWithLink() method
    - Add unlinkFileFromRoute() method
    - Create getAvailableRoutes() method
    - _Requirements: 2.1, 2.3, 3.1_
  
  - [ ] 5.2 Implement download and file management methods
    - Add downloadLinkedFile() method
    - Implement manageUnlinkedFiles() methods
    - _Requirements: 4.4, 5.2, 5.4_
  
  - [ ] 5.3 Create TypeScript interfaces for frontend
    - Define RouteSelectionOption interface
    - Create FileUploadWithLinkData interface
    - Add RouteDetailWithFile interface
    - _Requirements: 2.1, 4.1_

- [ ] 6. File Upload Component Extension
  - [ ] 6.1 Extend FileUploadComponent with route selection
    - Add route selection dropdown to upload form
    - Implement logic to fetch available routes
    - Add option to upload without linking
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ] 6.2 Implement file linking during upload
    - Connect upload form with linking service
    - Handle successful linking feedback
    - Add error handling for linking failures
    - _Requirements: 2.3, 2.4_

- [ ] 7. Route Management Components Extension
  - [ ] 7.1 Extend RouteEditComponent with unlinking
    - Add unlink file option for routes with linked files
    - Implement confirmation dialog for unlinking
    - Update route display after unlinking
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 7.2 Extend RouteDetailComponent with download
    - Add download button next to 'Ver en Wikiloc' button
    - Display explanatory message when download available
    - Hide download elements when no file linked
    - _Requirements: 4.1, 4.3, 4.5_
  
  - [ ] 7.3 Implement download functionality
    - Connect download button with download service
    - Handle download errors gracefully
    - _Requirements: 4.4_

- [ ] 8. File Management Component
  - [ ] 8.1 Create FileManagementComponent
    - Create new component for unlinked files management
    - Implement file list display with metadata
    - Add delete functionality for unlinked files
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 8.2 Add real-time updates
    - Integrate WebSocket updates for file operations
    - Update file list automatically after deletions
    - _Requirements: 5.5, 6.3_

- [ ] 9. Integration and WebSocket Updates
  - [ ] 9.1 Extend WebSocketService for file operations
    - Add events for file linking/unlinking operations
    - Implement real-time updates for route changes
    - Add file deletion notifications
    - _Requirements: 6.3_
  
  - [ ] 9.2 Wire all components together
    - Ensure proper navigation between components
    - Add file management to main navigation
    - Test complete user flows
    - _Requirements: 6.1_

- [ ] 10. Error Handling and Validation
  - [ ] 10.1 Implement comprehensive error handling
    - Add file size and type validation
    - Handle concurrent modification scenarios
    - Implement proper error messages for users
    - Handle file not found scenarios
  
  - [ ] 10.2 Add data consistency checks
    - Implement orphaned reference detection
    - Add duplicate link prevention
    - Validate file_track value formats

- [ ] 11. Final Integration and Testing
  - [ ] 11.1 Complete end-to-end integration
    - Test all user flows from upload to download
    - Verify WebSocket real-time updates
    - Ensure proper error handling throughout
  
  - [ ] 11.2 Performance optimization
    - Optimize database queries with proper indexing
    - Implement file download caching if needed
    - Test with large files and multiple concurrent users

- [ ] 12. Final Checkpoint - Complete System
  - Ensure all functionality works end-to-end
  - Verify all requirements are met
  - Ask the user if questions arise

## Notes

- Each task builds incrementally on previous work
- Database changes are implemented first to support all other functionality
- Frontend components extend existing ones to maintain consistency
- WebSocket integration provides real-time updates as specified
- Error handling is comprehensive to ensure system reliability
- All tasks reference specific requirements for traceability