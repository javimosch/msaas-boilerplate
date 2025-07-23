#!/usr/bin/env node

// Import required libraries
require('dotenv').config({ path: '../.env' });
const commander = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const Stripe = require('stripe');
const boxen = require('boxen');
const Table = require('cli-table3');
const jsonColorizer = require('json-colorizer');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Initialize Stripe
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
if (!stripeApiKey) {
  console.error(chalk.red('Error: STRIPE_SECRET_KEY not found in environment'));
  console.log(chalk.yellow('Make sure you have set up .env file with STRIPE_SECRET_KEY'));
  process.exit(1);
}

const stripe = new Stripe(stripeApiKey);

// Set up commander
const program = new commander.Command();
program
  .version('1.0.0')
  .description('Interactive CLI for managing Stripe prices');

// Helper function to pretty print JSON
function prettyJson(obj) {
  return jsonColorizer(JSON.stringify(obj, null, 2));
}

// Helper function to open a text editor for editing JSON
async function editJsonInEditor(jsonObj) {
  // Create a temporary file
  const tempFilePath = path.join(__dirname, 'temp_edit.json');
  
  // Write the JSON to the temp file
  await fs.writeFile(tempFilePath, JSON.stringify(jsonObj, null, 2));
  
  // Determine which editor to use
  const editor = process.env.EDITOR || 'vim';
  
  console.log(chalk.yellow(`Opening ${editor} to edit metadata...`));
  console.log(chalk.yellow('Save and exit the editor when done.'));
  
  try {
    // Open the editor
    execSync(`${editor} ${tempFilePath}`, { stdio: 'inherit' });
    
    // Read the edited file
    const edited = await fs.readFile(tempFilePath, 'utf8');
    await fs.unlink(tempFilePath); // Clean up
    
    return JSON.parse(edited);
  } catch (error) {
    console.error(chalk.red('Error editing metadata:'), error.message);
    try {
      await fs.unlink(tempFilePath); // Try to clean up even on error
    } catch (e) {
      // Ignore errors during cleanup
    }
    return null;
  }
}

// Function to display Stripe prices and let user select one
async function listAndSelectPrice() {
  const spinner = ora('Fetching prices from Stripe...').start();
  
  try {
    const pricesList = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });
    
    spinner.succeed('Prices fetched successfully');
    
    if (pricesList.data.length === 0) {
      console.log(chalk.yellow('No active prices found in your Stripe account'));
      return null;
    }
    
    // Display prices in a table
    const table = new Table({
      head: ['#', 'ID', 'Product', 'Price', 'Currency', 'Interval', 'Active'],
      style: { head: ['cyan'] }
    });
    
    pricesList.data.forEach((price, index) => {
      const productName = price.product ? price.product.name : 'Unknown Product';
      const amount = price.unit_amount ? `${(price.unit_amount / 100).toFixed(2)}` : 'N/A';
      const interval = price.recurring ? `${price.recurring.interval_count} ${price.recurring.interval}` : 'One-time';
      
      table.push([
        index + 1,
        price.id.substring(0, 10) + '...',
        productName,
        amount,
        price.currency.toUpperCase(),
        interval,
        price.active ? chalk.green('✓') : chalk.red('✗')
      ]);
    });
    
    console.log(table.toString());
    
    // Let user select a price
    const { selectedIndex } = await inquirer.prompt([
      {
        type: 'number',
        name: 'selectedIndex',
        message: 'Select a price by number:',
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= pricesList.data.length
            ? true
            : `Please enter a number between 1 and ${pricesList.data.length}`;
        }
      }
    ]);
    
    return pricesList.data[selectedIndex - 1];
  } catch (error) {
    spinner.fail('Failed to fetch prices');
    console.error(chalk.red('Error:'), error.message);
    return null;
  }
}

// Command to view a price in detail
program
  .command('view')
  .description('View details of a Stripe price')
  .action(async () => {
    const selectedPrice = await listAndSelectPrice();
    
    if (selectedPrice) {
      // Fetch complete price details with expanded fields
      const spinner = ora('Fetching price details...').start();
      try {
        const price = await stripe.prices.retrieve(selectedPrice.id, {
          expand: ['product', 'tiers']
        });
        spinner.succeed('Price details fetched');
        
        console.log(boxen(prettyJson(price), {
          padding: 1,
          margin: 1,
          borderColor: 'green',
          title: `Price: ${price.id}`
        }));
      } catch (error) {
        spinner.fail('Failed to fetch price details');
        console.error(chalk.red('Error:'), error.message);
      }
    }
  });

// Command to edit price metadata
program
  .command('edit-metadata')
  .description('Edit metadata of a Stripe price')
  .action(async () => {
    const selectedPrice = await listAndSelectPrice();
    
    if (selectedPrice) {
      // Fetch complete price details
      const spinner = ora('Fetching price details...').start();
      try {
        const price = await stripe.prices.retrieve(selectedPrice.id);
        spinner.succeed('Price details fetched');
        
        // Display current metadata
        console.log(chalk.blue('Current metadata:'));
        console.log(prettyJson(price.metadata || {}));
        
        // Ask if user wants to edit metadata
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to edit metadata?',
            default: true
          }
        ]);
        
        if (confirm) {
          // Let user edit metadata in a text editor
          const currentMetadata = price.metadata || {};
          const updatedMetadata = await editJsonInEditor(currentMetadata);
          
          if (updatedMetadata) {
            // Update price with new metadata
            const updateSpinner = ora('Updating price metadata...').start();
            try {
              const updatedPrice = await stripe.prices.update(selectedPrice.id, {
                metadata: updatedMetadata
              });
              updateSpinner.succeed('Price metadata updated successfully');
              
              console.log(chalk.blue('Updated metadata:'));
              console.log(prettyJson(updatedPrice.metadata));
            } catch (error) {
              updateSpinner.fail('Failed to update price metadata');
              console.error(chalk.red('Error:'), error.message);
            }
          }
        }
      } catch (error) {
        spinner.fail('Failed to fetch price details');
        console.error(chalk.red('Error:'), error.message);
      }
    }
  });

// Default command to show help
program
  .action(() => {
    program.outputHelp();
  });

// Parse command line arguments
program.parse(process.argv);
