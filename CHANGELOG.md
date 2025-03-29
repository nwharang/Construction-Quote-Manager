# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Theme system with light/dark/system modes
- Theme toggle component with visual feedback
- Theme persistence in user settings
- Theme provider for consistent theme management
- Initial project setup with Next.js, TypeScript, and tRPC
- Database schema with Drizzle ORM
- Authentication system with NextAuth.js
- Quote management system
- Customer management system
- Settings system with user preferences
- Localization framework with support for multiple languages
- Toast notifications using react-hot-toast
- Basic UI components using HeroUI
- Financial reporting system
- Transaction tracking

### Changed
- Replaced next-themes with custom theme implementation
- Updated layout to use new theme toggle component
- Improved theme transition animations
- Switched from Sonner to react-hot-toast for notifications
- Updated database schema to include customer, transaction, and theme preferences
- Improved quote list page with better type safety and error handling
- Enhanced settings management with proper validation
- Updated context documentation to reflect current implementation

### Fixed
- Theme flicker on initial load
- Theme persistence across page reloads
- Type errors in quote router
- Data display issues in quotes list
- Settings persistence issues
- Localization formatting problems

### Removed
- Legacy theme implementation
- Unused dependencies
- Sonner toast implementation
- Legacy quote management code

## [0.1.0] - 2024-03-19

### Added
- Initial release
- Basic project structure
- Core functionality for quote management
- User authentication
- Database integration
- Basic UI components 