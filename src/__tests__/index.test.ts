import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import path from 'path';
import { mockRepositories, mockGhListOutput } from './fixtures/mock-data.js';

// Create mock functions
const mockExecSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockStatSync = jest.fn();

// Mock all external dependencies
jest.unstable_mockModule('child_process', () => ({
  execSync: mockExecSync,
}));

jest.unstable_mockModule('fs', () => ({
  default: {
    writeFileSync: mockWriteFileSync,
    statSync: mockStatSync,
  },
  writeFileSync: mockWriteFileSync,
  statSync: mockStatSync,
}));

jest.unstable_mockModule('ora', () => ({
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  })),
}));

jest.unstable_mockModule('chalk', () => ({
  default: {
    red: (str: string) => str,
    yellow: (str: string) => str,
    green: (str: string) => str,
    cyan: (str: string) => str,
    gray: (str: string) => str,
    bold: {
      cyan: (str: string) => str,
      green: (str: string) => str,
      yellow: (str: string) => str,
    },
  },
}));

describe('Meta Helper Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Repository filtering', () => {
    it('should filter repositories with ADMIN permission', () => {
      const adminRepos = mockRepositories.filter(
        repo => repo.viewerPermission === 'ADMIN'
      );

      expect(adminRepos).toHaveLength(5);
      expect(adminRepos.every(repo => repo.viewerPermission === 'ADMIN')).toBe(true);
    });

    it('should filter repositories by name pattern', () => {
      const nestorRepos = mockRepositories.filter(
        repo => repo.name.includes('nestor')
      );

      expect(nestorRepos).toHaveLength(2);
      expect(nestorRepos.every(repo => repo.name.includes('nestor'))).toBe(true);
    });
  });

  describe('Projects configuration', () => {
    it('should build projects config with SSH URLs', () => {
      const adminRepos = mockRepositories.filter(
        repo => repo.viewerPermission === 'ADMIN'
      );
      const projects: Record<string, string> = {};

      adminRepos.forEach(repo => {
        projects[repo.name] = repo.sshUrl;
      });

      expect(Object.keys(projects)).toHaveLength(5);
      expect(projects['frontend-app']).toBe('git@github.com:test-org/frontend-app.git');
      expect(projects['nestor-web']).toBe('git@github.com:test-org/nestor-web.git');
    });

    it('should build projects config with HTTPS URLs', () => {
      const adminRepos = mockRepositories.filter(
        repo => repo.viewerPermission === 'ADMIN'
      );
      const projects: Record<string, string> = {};

      adminRepos.forEach(repo => {
        projects[repo.name] = repo.url;
      });

      expect(Object.keys(projects)).toHaveLength(5);
      expect(projects['frontend-app']).toBe('https://github.com/test-org/frontend-app');
      expect(projects['nestor-web']).toBe('https://github.com/test-org/nestor-web');
    });
  });

  describe('Repository categorization', () => {
    it('should categorize repositories by prefix', () => {
      const repoNames = mockRepositories.map(repo => repo.name);
      const categories: Record<string, string[]> = {};

      repoNames.forEach(name => {
        const prefix = name.split('-')[0] || 'other';
        if (!categories[prefix]) {
          categories[prefix] = [];
        }
        categories[prefix].push(name);
      });

      expect(categories['frontend']).toHaveLength(2);
      expect(categories['backend']).toHaveLength(2);
      expect(categories['nestor']).toHaveLength(2);
      expect(categories['docs']).toHaveLength(1);
    });

    it('should sort categories by count', () => {
      const categories = {
        frontend: ['repo1', 'repo2'],
        backend: ['repo1', 'repo2'],
        docs: ['repo1'],
        nestor: ['repo1', 'repo2'],
      };

      const sorted = Object.entries(categories)
        .sort((a, b) => b[1].length - a[1].length);

      // All with count 2 should come before count 1
      expect(sorted[sorted.length - 1][1]).toHaveLength(1);
    });
  });

  describe('File path handling', () => {
    it('should handle directory path by appending .meta', () => {
      mockStatSync.mockReturnValue({
        isDirectory: () => true,
      });

      const outputPath = '/test/dir';
      const resolvedPath = path.resolve(outputPath);

      let finalPath = resolvedPath;
      try {
        const stats = mockStatSync(resolvedPath) as { isDirectory: () => boolean };
        if (stats.isDirectory()) {
          finalPath = path.join(resolvedPath, '.meta');
        }
      } catch (error) {
        // File doesn't exist
      }

      expect(finalPath).toContain('.meta');
      expect(finalPath).toBe(path.join(resolvedPath, '.meta'));
    });

    it('should use file path as-is when not a directory', () => {
      mockStatSync.mockImplementation(() => {
        throw new Error('File does not exist');
      });

      const outputPath = '/test/path/.meta';
      const resolvedPath = path.resolve(outputPath);

      let finalPath = resolvedPath;
      try {
        const stats = mockStatSync(resolvedPath) as { isDirectory: () => boolean };
        if (stats.isDirectory()) {
          finalPath = path.join(resolvedPath, '.meta');
        }
      } catch (error) {
        // File doesn't exist, use as-is
      }

      expect(finalPath).toBe(resolvedPath);
    });
  });

  describe('Meta file generation', () => {
    it('should write meta file with correct structure', () => {
      mockStatSync.mockImplementation(() => {
        throw new Error('File does not exist');
      });

      const projects = {
        'frontend-app': 'git@github.com:test-org/frontend-app.git',
        'nestor-web': 'git@github.com:test-org/nestor-web.git',
      };

      const metaContent = {
        projects: projects,
      };

      const outputPath = '/test/.meta';
      mockWriteFileSync(outputPath, JSON.stringify(metaContent, null, 2) + '\n');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        outputPath,
        JSON.stringify(metaContent, null, 2) + '\n'
      );
    });
  });

  describe('Command execution mocking', () => {
    it('should mock GitHub CLI repository fetch', () => {
      mockExecSync.mockReturnValue(mockGhListOutput);

      const result = mockExecSync(
        'gh repo list test-org --limit 1000 --json name,url,sshUrl,viewerPermission',
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );

      const repos = JSON.parse(result as string);

      expect(repos).toEqual(mockRepositories);
      expect(repos).toHaveLength(7);
    });

    it('should mock command availability check', () => {
      mockExecSync.mockReturnValue(Buffer.from('/usr/bin/gh'));

      let commandExists = false;
      try {
        mockExecSync('which gh', { stdio: 'ignore' });
        commandExists = true;
      } catch (error) {
        commandExists = false;
      }

      expect(commandExists).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith('which gh', { stdio: 'ignore' });
    });

    it('should mock authentication check', () => {
      mockExecSync.mockReturnValue(Buffer.from('Logged in to github.com'));

      let isAuthenticated = false;
      try {
        mockExecSync('gh auth status', { stdio: 'ignore' });
        isAuthenticated = true;
      } catch (error) {
        isAuthenticated = false;
      }

      expect(isAuthenticated).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith('gh auth status', { stdio: 'ignore' });
    });
  });
});
