# Requirements Document

## Introduction

This feature aims to centralize all TypeScript type definitions scattered throughout the application into a well-organized types system within `src/lib/types/`. Currently, types are defined inline across hooks, services, and API routes, making the codebase harder to maintain and leading to potential type duplication. The centralized types system will improve code organization, enable better type reuse, and make the application cleaner and more maintainable.

## Requirements

### Requirement 1

**User Story:** As a developer, I want all TypeScript types centralized in a dedicated types folder, so that I can easily find, reuse, and maintain type definitions across the application.

#### Acceptance Criteria

1. WHEN types are needed THEN the system SHALL provide them from `src/lib/types/` directory
2. WHEN a type is defined THEN it SHALL be exported from the appropriate domain-specific type file
3. WHEN importing types THEN developers SHALL import from centralized type files rather than inline definitions

### Requirement 2

**User Story:** As a developer, I want types organized by domain/feature, so that I can quickly locate relevant type definitions for specific functionality.

#### Acceptance Criteria

1. WHEN organizing types THEN the system SHALL group related types into domain-specific files (e.g., notes.types.ts, documents.types.ts)
2. WHEN a new feature is added THEN its types SHALL be placed in the appropriate domain file or new domain file if needed
3. WHEN types are shared across domains THEN they SHALL be placed in a common.types.ts file

### Requirement 3

**User Story:** As a developer, I want all existing inline type definitions removed and replaced with imports from the centralized system, so that there is no type duplication in the codebase.

#### Acceptance Criteria

1. WHEN refactoring existing code THEN all inline interface and type definitions SHALL be moved to centralized files
2. WHEN types are moved THEN all import statements SHALL be updated to reference the new centralized locations
3. WHEN the refactoring is complete THEN there SHALL be no duplicate type definitions across the codebase

### Requirement 4

**User Story:** As a developer, I want proper type exports and barrel exports, so that importing types is clean and consistent throughout the application.

#### Acceptance Criteria

1. WHEN exporting types THEN each domain file SHALL export all its types using named exports
2. WHEN providing easy imports THEN there SHALL be an index.ts file that re-exports commonly used types
3. WHEN importing types THEN developers SHALL be able to import multiple types from a single import statement

### Requirement 5

**User Story:** As a developer, I want types to align with the Prisma database schema, so that there is consistency between database models and TypeScript types.

#### Acceptance Criteria

1. WHEN defining database-related types THEN they SHALL align with the Prisma schema structure
2. WHEN Prisma models exist THEN corresponding TypeScript types SHALL be created for API responses and client-side usage
3. WHEN database relationships exist THEN the types SHALL properly represent those relationships

### Requirement 6

**User Story:** As a developer, I want the build process to work seamlessly with Bun, so that the centralized types system doesn't break the existing development workflow.

#### Acceptance Criteria

1. WHEN building the application THEN the centralized types SHALL compile without errors using Bun
2. WHEN running development server THEN type checking SHALL work correctly with the new structure
3. WHEN using the application THEN all functionality SHALL work exactly as before the refactoring