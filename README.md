# Meta Helper

A CLI tool to generate `.meta` configuration files for managing multiple GitHub repositories using the [meta](https://github.com/mateodelnorte/meta) tool.

## Features

- Fetches all repositories from a GitHub organization where you have admin access
- Supports both SSH and HTTPS URLs
- Filter repositories by name pattern
- Beautiful CLI interface with progress indicators
- Automatic categorization of repositories

## Installation

```bash
npm install
npm run build
```

Or run in development mode:

```bash
npm run dev -- --org adeo --output /path/to/.meta
```

## Usage

### Basic Usage

Generate a `.meta` file for all repositories you have admin access to:

```bash
npm start -- --org adeo --output /Users/mansouri/Projects/adeo/.meta
```

### Using HTTPS URLs

```bash
npm start -- --org adeo --https --output /Users/mansouri/Projects/adeo/.meta
```

### Filter by Repository Name

Get only repositories containing "nestor":

```bash
npm start -- --org adeo --filter nestor --output /Users/mansouri/Projects/adeo/.meta
```

### Combined Options

```bash
npm start -- --org adeo --https --filter sod --output /Users/mansouri/Projects/adeo/.meta
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `-o, --org <name>` | GitHub organization name | Yes | - |
| `--https` | Use HTTPS URLs instead of SSH | No | SSH |
| `--filter <pattern>` | Filter repositories by name pattern | No | - |
| `--output <path>` | Output path for .meta file | No | `./.meta` |
| `-h, --help` | Display help information | No | - |
| `-V, --version` | Display version number | No | - |

## Examples

### Example 1: ADEO Organization

```bash
npm start -- --org adeo --output /Users/mansouri/Projects/adeo/.meta
```

This will:
1. Fetch all repositories from the `adeo` organization
2. Filter to only those where you have admin access
3. Create a `.meta` file at `/Users/mansouri/Projects/adeo/.meta`

### Example 2: Filter for Nestor Repositories

```bash
npm start -- --org adeo --filter nestor --output /Users/mansouri/Projects/adeo/.meta
```

### Example 3: Use HTTPS for SAML SSO

```bash
npm start -- --org adeo --https --output /Users/mansouri/Projects/adeo/.meta
```

## SAML SSO Support

If your organization has SAML SSO enabled, you'll need to authorize your credentials:

### For SSH (default):
1. Visit https://github.com/settings/keys
2. Click "Configure SSO" next to your SSH key
3. Authorize it for your organization

### For HTTPS:
1. Create a Personal Access Token at https://github.com/settings/tokens
2. Click "Configure SSO" and authorize it for your organization

## Output Format

The generated `.meta` file follows this structure:

```json
{
  "projects": {
    "repo-name-1": "git@github.com:org/repo-name-1.git",
    "repo-name-2": "git@github.com:org/repo-name-2.git"
  }
}
```

## Using with Meta Tool

After generating the `.meta` file:

1. Install the meta tool globally:
   ```bash
   npm install -g meta
   ```

2. Navigate to the directory containing `.meta`:
   ```bash
   cd /Users/mansouri/Projects/adeo
   ```

3. Clone all repositories:
   ```bash
   meta git update
   ```

4. Use meta commands to manage all repos:
   ```bash
   meta git status
   meta git pull
   meta exec "npm install"
   ```

## Requirements

- Node.js 18+ (for ES modules support)
- GitHub CLI (`gh`) - Install with `brew install gh`
- Git
- Authenticated GitHub CLI (`gh auth login`)

## Development

### Build TypeScript

```bash
npm run build
```

### Run in Development Mode

```bash
npm run dev -- --org adeo --output test.meta
```

## License

ISC
