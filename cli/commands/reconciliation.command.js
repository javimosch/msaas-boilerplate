const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const reconciliationService = require('../../src/services/reconciliation.service');
const logger = require('../../src/utils/logger');
const { connectDB } = require('../../src/config/database');

/**
 * Command to run subscription reconciliation process
 * This verifies that the subscription statuses in the database match what's in Stripe
 */
async function reconciliationCommand() {

  await connectDB();

  console.log(chalk.blue('\n🔄 Stripe Subscription Reconciliation\n'));
  console.log(chalk.yellow('This will compare subscription statuses between Stripe and your database'));
  console.log(chalk.yellow('and update any inconsistencies in your database.\n'));
  
  // Confirm before proceeding
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to run the reconciliation process?',
      default: false
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.yellow('Reconciliation cancelled'));
    return;
  }
  
  const spinner = ora('Running subscription reconciliation...').start();
  
  try {
    // Run the reconciliation process
    await reconciliationService.verifySubscriptionStatuses();
    
    spinner.succeed(chalk.green('Reconciliation completed successfully'));
    console.log(chalk.green('✓ Database subscriptions are now in sync with Stripe'));
  } catch (error) {
    spinner.fail('Reconciliation failed');
    console.error(chalk.red('Error:'), error.message);
    logger.error('Manual reconciliation failed:', error);
  }
}

module.exports = {
  command: 'reconcile',
  description: 'Reconcile subscription statuses between Stripe and database',
  action: reconciliationCommand
};
