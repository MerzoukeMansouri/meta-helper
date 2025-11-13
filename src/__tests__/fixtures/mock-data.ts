export interface Repository {
  name: string;
  url: string;
  sshUrl: string;
  viewerPermission: string;
}

export const mockRepositories: Repository[] = [
  {
    name: 'frontend-app',
    url: 'https://github.com/test-org/frontend-app',
    sshUrl: 'git@github.com:test-org/frontend-app.git',
    viewerPermission: 'ADMIN',
  },
  {
    name: 'frontend-components',
    url: 'https://github.com/test-org/frontend-components',
    sshUrl: 'git@github.com:test-org/frontend-components.git',
    viewerPermission: 'ADMIN',
  },
  {
    name: 'backend-api',
    url: 'https://github.com/test-org/backend-api',
    sshUrl: 'git@github.com:test-org/backend-api.git',
    viewerPermission: 'ADMIN',
  },
  {
    name: 'backend-workers',
    url: 'https://github.com/test-org/backend-workers',
    sshUrl: 'git@github.com:test-org/backend-workers.git',
    viewerPermission: 'WRITE',
  },
  {
    name: 'docs-site',
    url: 'https://github.com/test-org/docs-site',
    sshUrl: 'git@github.com:test-org/docs-site.git',
    viewerPermission: 'READ',
  },
  {
    name: 'nestor-web',
    url: 'https://github.com/test-org/nestor-web',
    sshUrl: 'git@github.com:test-org/nestor-web.git',
    viewerPermission: 'ADMIN',
  },
  {
    name: 'nestor-api',
    url: 'https://github.com/test-org/nestor-api',
    sshUrl: 'git@github.com:test-org/nestor-api.git',
    viewerPermission: 'ADMIN',
  },
];

export const mockAdminRepositories = mockRepositories.filter(
  repo => repo.viewerPermission === 'ADMIN'
);

export const mockGhListOutput = JSON.stringify(mockRepositories);
