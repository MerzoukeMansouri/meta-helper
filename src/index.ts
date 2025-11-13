#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

interface Repository {
  name: string;
  url: string;
  sshUrl: string;
  viewerPermission: string;
}

interface MetaConfig {
  projects: Record<string, string>;
}

interface RepositoryCategories {
  [key: string]: string[];
}

function checkCommand(command: string, installInstructions: string): boolean {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error(chalk.red(`✗ Error: ${command} is not installed.`));
    console.error(chalk.yellow(`  ${installInstructions}`));
    return false;
  }
}

async function main() {
  program
    .name('meta-helper')
    .description('Update .meta file with GitHub repositories where you have admin permissions')
    .version('1.0.0')
    .requiredOption('-o, --org <organization>', 'GitHub organization name')
    .option('--https', 'Use HTTPS URLs instead of SSH (default: SSH)')
    .option('--filter <pattern>', 'Filter repositories by name pattern')
    .option('--output <path>', 'Output path for .meta file (default: ./.meta)')
    .parse(process.argv);

  const options = program.opts();

  console.log(chalk.bold.cyan('\n🔄 Meta Repository Helper\n'));

  // Check prerequisites
  console.log(chalk.bold('Checking prerequisites...'));

  if (!checkCommand('gh', 'Install it with: brew install gh')) {
    process.exit(1);
  }
  console.log(chalk.green('✓ GitHub CLI (gh) is installed'));

  // Check authentication
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    console.log(chalk.green('✓ Authenticated with GitHub\n'));
  } catch (error) {
    console.error(chalk.red('✗ Not authenticated with GitHub CLI'));
    console.error(chalk.yellow('  Run: gh auth login'));
    process.exit(1);
  }

  // Determine URL type
  const urlField = options.https ? 'url' : 'sshUrl';
  const urlType = options.https ? 'HTTPS' : 'SSH';

  // Handle output path - if it's a directory, append .meta
  let outputPath = options.output || './.meta';
  const resolvedPath = path.resolve(outputPath);

  try {
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      outputPath = path.join(resolvedPath, '.meta');
    }
  } catch (error) {
    // File doesn't exist yet, which is fine
  }

  console.log(chalk.bold('Configuration:'));
  console.log(`  Organization: ${chalk.cyan(options.org)}`);
  console.log(`  URL Type: ${chalk.cyan(urlType)}`);
  if (options.filter) {
    console.log(`  Filter: ${chalk.cyan(options.filter)}`);
  }
  console.log(`  Output: ${chalk.cyan(path.resolve(outputPath))}`);
  console.log('');

  // Fetch repositories
  const spinner = ora(`Fetching ${options.org} repositories from GitHub...`).start();

  try {
    const result = execSync(
      `gh repo list ${options.org} --limit 1000 --json name,url,sshUrl,viewerPermission`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    const repos: Repository[] = JSON.parse(result);
    spinner.succeed(`Found ${chalk.bold(repos.length)} total ${options.org} repositories`);

    // Filter repositories with ADMIN permissions
    spinner.start('Filtering repositories with ADMIN permissions...');
    let filteredRepos = repos.filter(repo => repo.viewerPermission === 'ADMIN');
    spinner.succeed(`Found ${chalk.bold(filteredRepos.length)} repositories with ADMIN access`);

    if (options.filter) {
      spinner.start(`Applying name filter: "${options.filter}"...`);
      filteredRepos = filteredRepos.filter(repo => repo.name.includes(options.filter));
      spinner.succeed(`Filtered to ${chalk.bold(filteredRepos.length)} repositories`);
    }

    // Build projects object
    spinner.start('Building .meta configuration...');
    const projects: Record<string, string> = {};
    filteredRepos.forEach(repo => {
      projects[repo.name] = repo[urlField as keyof Repository] as string;
    });

    // Create .meta file content
    const metaContent: MetaConfig = {
      projects: projects
    };

    // Write to .meta file
    const resolvedPath = path.resolve(outputPath);
    fs.writeFileSync(resolvedPath, JSON.stringify(metaContent, null, 2) + '\n');
    spinner.succeed('Successfully created .meta file');

    // Print summary
    console.log(chalk.bold.green('\n✓ Update complete!\n'));
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.gray('Location:')} ${resolvedPath}`);
    console.log(`  ${chalk.gray('Repositories:')} ${chalk.bold.cyan(Object.keys(projects).length)}`);
    console.log(`  ${chalk.gray('URL Type:')} ${chalk.cyan(urlType)}`);

    if (options.filter) {
      console.log(`  ${chalk.gray('Filter:')} ${chalk.cyan(options.filter)}`);
    }

    // Print repository categories
    if (Object.keys(projects).length > 0) {
      console.log(chalk.bold('\nRepository Categories:'));

      const categories: RepositoryCategories = {};
      const repoNames = Object.keys(projects);

      // Extract prefixes (everything before first hyphen or full name)
      repoNames.forEach(name => {
        const prefix = name.split('-')[0] || 'other';
        if (!categories[prefix]) {
          categories[prefix] = [];
        }
        categories[prefix].push(name);
      });

      // Sort categories by count (descending)
      const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10); // Show top 10 categories

      sortedCategories.forEach(([category, repos]) => {
        console.log(`  ${chalk.cyan('•')} ${chalk.bold(category)}: ${repos.length} repositories`);
      });

      if (Object.keys(categories).length > 10) {
        console.log(`  ${chalk.gray('... and')} ${Object.keys(categories).length - 10} ${chalk.gray('more categories')}`);
      }
    }

    // Print SAML SSO warning if organization might have it
    console.log(chalk.bold.yellow('\n⚠️  Important: Check SAML SSO Requirements\n'));

    if (options.https) {
      console.log(chalk.yellow('You are using HTTPS URLs. If SAML SSO is enabled:'));
      console.log('  1. Create a Personal Access Token at:');
      console.log(chalk.cyan('     https://github.com/settings/tokens'));
      console.log('  2. Click "Configure SSO" and authorize it for the organization');
    } else {
      console.log(chalk.yellow('You are using SSH URLs. If SAML SSO is enabled:'));
      console.log('  1. Visit your SSH keys at:');
      console.log(chalk.cyan('     https://github.com/settings/keys'));
      console.log('  2. Click "Configure SSO" next to your SSH key');
      console.log(`  3. Authorize it for the ${options.org} organization`);
    }

    console.log(chalk.bold.green('\n📦 Next Steps:\n'));
    console.log('  1. Review SAML SSO requirements (if applicable)');
    console.log('  2. Install meta tool:');
    console.log(chalk.cyan('     npm install -g meta'));
    console.log('  3. Navigate to the .meta file directory and run:');
    console.log(chalk.cyan('     meta git update'));
    console.log('');

  } catch (error) {
    spinner.fail('Error fetching repositories');
    if (error instanceof Error) {
      console.error(chalk.red(`\n✗ ${error.message}`));
    }
    process.exit(1);
  }
}

main();
