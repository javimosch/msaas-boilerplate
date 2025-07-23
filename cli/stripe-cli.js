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
const { promisify } = require('util');
const figlet = require('figlet');
clear = require('clear');

// Import commands
const reconciliationCommand = require('./commands/reconciliation.command');

// Initialize Stripe
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
if (!stripeApiKey) {
  console.error(chalk.red('❌ Error: STRIPE_SECRET_KEY not found in environment'));
  console.log(chalk.yellow('💡 Make sure you have set up .env file with STRIPE_SECRET_KEY'));
  process.exit(1);
}

const stripe = new Stripe(stripeApiKey);

// Set up commander for passing arguments
const program = new commander.Command();
program
  .version('1.0.0')
  .description('Interactive CLI for managing Stripe prices')
  .option('-i, --interactive', 'Start in interactive mode', true)
  .option('-m, --menu', 'Show the main menu', true);

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

// Function to display Stripe products and let user select one
async function listAndSelectProduct(includeInactive = false) {
  const spinner = ora('Fetching products from Stripe...').start();
  
  try {
    const productsList = await stripe.products.list({
      limit: 100
    });
    
    spinner.succeed('Products fetched successfully');
    
    if (productsList.data.length === 0) {
      console.log(chalk.yellow('No products found in your Stripe account'));
      return null;
    }
    
    // Filter products if inactive not requested
    const products = includeInactive 
      ? productsList.data 
      : productsList.data.filter(product => product.active);
    
    if (products.length === 0) {
      console.log(chalk.yellow('No active products found in your Stripe account'));
      return null;
    }
    
    // Check for app identification in metadata
    const productsByApp = new Map();
    products.forEach(product => {
      const appName = product.metadata?.app_name || 'Uncategorized';
      if (!productsByApp.has(appName)) {
        productsByApp.set(appName, []);
      }
      productsByApp.get(appName).push(product);
    });
    
    // Display products grouped by app
    console.log(chalk.blue('\nProducts by Application:\n'));
    
    const appsArray = Array.from(productsByApp.keys());
    for (let i = 0; i < appsArray.length; i++) {
      const appName = appsArray[i];
      console.log(chalk.cyan(`\n[${i + 1}] ${appName}\n`));
      
      const table = new Table({
        head: ['#', 'ID', 'Name', 'Description', 'Active'],
        style: { head: ['cyan'] }
      });
      
      const productsInApp = productsByApp.get(appName);
      productsInApp.forEach((product, index) => {
        table.push([
          `${i + 1}.${index + 1}`,
          product.id.substring(0, 10) + '...',
          product.name,
          product.description?.substring(0, 30) + (product.description?.length > 30 ? '...' : '') || 'No description',
          product.active ? chalk.green('✓') : chalk.red('✗')
        ]);
      });
      
      console.log(table.toString());
    }
    
    // Let user select an app first
    const { appIndex } = await inquirer.prompt([
      {
        type: 'number',
        name: 'appIndex',
        message: 'Select an application by number:',
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= appsArray.length
            ? true
            : `Please enter a number between 1 and ${appsArray.length}`;
        }
      }
    ]);
    
    const selectedAppName = appsArray[appIndex - 1];
    const productsInSelectedApp = productsByApp.get(selectedAppName);
    
    // Then let user select a product within that app
    const { productIndex } = await inquirer.prompt([
      {
        type: 'number',
        name: 'productIndex',
        message: `Select a product from ${selectedAppName} by number (after decimal point):`,
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= productsInSelectedApp.length
            ? true
            : `Please enter a number between 1 and ${productsInSelectedApp.length}`;
        }
      }
    ]);
    
    return productsInSelectedApp[productIndex - 1];
  } catch (error) {
    spinner.fail('Failed to fetch products');
    console.error(chalk.red('Error:'), error.message);
    return null;
  }
}

// Function to display Stripe prices and let user select one
async function listAndSelectPrice(productId = null, includeInactive = false) {
  const spinner = ora('Fetching prices from Stripe...').start();
  
  try {
    const options = {
      expand: ['data.product'],
      limit: 100
    };
    
    // Filter by product if provided
    if (productId) {
      options.product = productId;
    }
    
    const pricesList = await stripe.prices.list(options);
    
    spinner.succeed('Prices fetched successfully');
    
    if (pricesList.data.length === 0) {
      console.log(chalk.yellow('No prices found for this product'));
      return null;
    }
    
    // Filter by active status if needed
    const prices = includeInactive 
      ? pricesList.data 
      : pricesList.data.filter(price => price.active);
    
    if (prices.length === 0) {
      console.log(chalk.yellow('No active prices found for this product'));
      return null;
    }
    
    // Display prices in a table
    const table = new Table({
      head: ['#', 'ID', 'Product', 'Price', 'Currency', 'Interval', 'Active'],
      style: { head: ['cyan'] }
    });
    
    prices.forEach((price, index) => {
      const productName = price.product ? price.product.name : 'Unknown Product';
      const amount = price.unit_amount ? `${(price.unit_amount / 100).toFixed(2)}` : 'N/A';
      const interval = price.recurring ? `${price.recurring.interval_count} ${price.recurring.interval}` : 'One-time';
      const nickname = price.nickname ? ` (${price.nickname})` : '';
      
      table.push([
        index + 1,
        price.id.substring(0, 10) + '...',
        productName + nickname,
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
          return num > 0 && num <= prices.length
            ? true
            : `Please enter a number between 1 and ${prices.length}`;
        }
      }
    ]);
    
    return prices[selectedIndex - 1];
  } catch (error) {
    spinner.fail('Failed to fetch prices');
    console.error(chalk.red('Error:'), error.message);
    return null;
  }
}

// Command to view products by app
program
  .command('products')
  .description('View and manage Stripe products by application')
  .option('-a, --all', 'Include inactive products')
  .action(async (options) => {
    const selectedProduct = await listAndSelectProduct(options.all);
    
    if (selectedProduct) {
      // Fetch complete product details
      const spinner = ora('Fetching product details...').start();
      try {
        const product = await stripe.products.retrieve(selectedProduct.id);
        spinner.succeed('Product details fetched');
        
        console.log(boxen(prettyJson(product), {
          padding: 1,
          margin: 1,
          borderColor: 'green',
          title: `Product: ${product.name}`
        }));
        
        // Ask what to do with this product
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do with this product?',
            choices: [
              { name: 'View prices for this product', value: 'prices' },
              { name: 'Edit product metadata', value: 'edit-metadata' },
              { name: product.active ? 'Deactivate product' : 'Activate product', value: 'toggle-active' },
              { name: 'Create a new price for this product', value: 'create-price' },
              { name: 'Back to main menu', value: 'back' }
            ]
          }
        ]);
        
        switch (action) {
          case 'prices':
            // Show prices for this product
            const includeInactive = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'include',
                message: 'Include inactive prices?',
                default: false
              }
            ]);
            const selectedPrice = await listAndSelectPrice(product.id, includeInactive.include);
            if (selectedPrice) {
              await showPriceDetails(selectedPrice.id);
            }
            break;
          
          case 'edit-metadata':
            // Edit product metadata
            await editProductMetadata(product.id);
            break;
          
          case 'toggle-active':
            // Toggle product active status
            await toggleProductActive(product.id, !product.active);
            break;
          
          case 'create-price':
            // Create new price for this product
            await createNewPrice(product.id);
            break;
            
          case 'back':
          default:
            // Return to main menu
            break;
        }
      } catch (error) {
        spinner.fail('Failed to fetch product details');
        console.error(chalk.red('Error:'), error.message);
      }
    }
  });

// Helper function to show price details and offer actions
async function showPriceDetails(priceId) {
  const spinner = ora('Fetching price details...').start();
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product', 'tiers']
    });
    spinner.succeed('Price details fetched');
    
    console.log(boxen(prettyJson(price), {
      padding: 1,
      margin: 1,
      borderColor: 'green',
      title: `Price: ${price.product?.name || 'Unknown Product'} - ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`
    }));
    
    // Show available actions for this price
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do with this price?',
        choices: [
          { name: 'Edit metadata', value: 'edit-metadata' },
          { name: price.active ? 'Deactivate price' : 'Activate price', value: 'toggle-active' },
          { name: 'Back to main menu', value: 'back' }
        ]
      }
    ]);
    
    switch (action) {
      case 'edit-metadata':
        await editPriceMetadata(priceId);
        break;
      
      case 'toggle-active':
        await togglePriceActive(priceId, !price.active);
        break;
        
      case 'back':
      default:
        // Return to main menu
        break;
    }
  } catch (error) {
    spinner.fail('Failed to fetch price details');
    console.error(chalk.red('Error:'), error.message);
  }
}

// Helper function to edit product metadata
async function editProductMetadata(productId) {
  const spinner = ora('Fetching product details...').start();
  try {
    const product = await stripe.products.retrieve(productId);
    spinner.succeed('Product details fetched');
    
    // Display current metadata
    console.log(chalk.blue('Current product metadata:'));
    console.log(prettyJson(product.metadata || {}));
    
    // Let user edit metadata in a text editor
    const currentMetadata = product.metadata || {};
    const updatedMetadata = await editJsonInEditor(currentMetadata);
    
    if (updatedMetadata) {
      // Update product with new metadata
      const updateSpinner = ora('Updating product metadata...').start();
      try {
        const updatedProduct = await stripe.products.update(productId, {
          metadata: updatedMetadata
        });
        updateSpinner.succeed('Product metadata updated successfully');
        
        console.log(chalk.blue('Updated metadata:'));
        console.log(prettyJson(updatedProduct.metadata));
      } catch (error) {
        updateSpinner.fail('Failed to update product metadata');
        console.error(chalk.red('Error:'), error.message);
      }
    }
  } catch (error) {
    spinner.fail('Failed to fetch product details');
    console.error(chalk.red('Error:'), error.message);
  }
}

// Helper function to toggle product active status
async function toggleProductActive(productId, active) {
  const actionText = active ? 'Activating' : 'Deactivating';
  const spinner = ora(`${actionText} product...`).start();
  
  try {
    const product = await stripe.products.update(productId, {
      active: active
    });
    
    spinner.succeed(`Product ${active ? 'activated' : 'deactivated'} successfully`);
    console.log(`Product ${product.name} is now ${active ? 'active' : 'inactive'}`);
    
  } catch (error) {
    spinner.fail(`Failed to ${active ? 'activate' : 'deactivate'} product`);
    console.error(chalk.red('Error:'), error.message);
  }
}

// Helper function to edit price metadata
async function editPriceMetadata(priceId) {
  const spinner = ora('Fetching price details...').start();
  try {
    const price = await stripe.prices.retrieve(priceId);
    spinner.succeed('Price details fetched');
    
    // Display current metadata
    console.log(chalk.blue('Current price metadata:'));
    console.log(prettyJson(price.metadata || {}));
    
    // Let user edit metadata in a text editor
    const currentMetadata = price.metadata || {};
    const updatedMetadata = await editJsonInEditor(currentMetadata);
    
    if (updatedMetadata) {
      // Update price with new metadata
      const updateSpinner = ora('Updating price metadata...').start();
      try {
        const updatedPrice = await stripe.prices.update(priceId, {
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
  } catch (error) {
    spinner.fail('Failed to fetch price details');
    console.error(chalk.red('Error:'), error.message);
  }
}

// Helper function to toggle price active status
async function togglePriceActive(priceId, active) {
  const actionText = active ? 'Activating' : 'Deactivating';
  const spinner = ora(`${actionText} price...`).start();
  
  try {
    const price = await stripe.prices.update(priceId, {
      active: active
    });
    
    spinner.succeed(`Price ${active ? 'activated' : 'deactivated'} successfully`);
    
  } catch (error) {
    spinner.fail(`Failed to ${active ? 'activate' : 'deactivate'} price`);
    console.error(chalk.red('Error:'), error.message);
  }
}

// Helper function to create a new price for a product
async function createNewPrice(productId) {
  console.log(chalk.blue('Creating a new price for the product'));
  
  try {
    // Get product details
    const product = await stripe.products.retrieve(productId);
    console.log(chalk.cyan(`Product: ${product.name}`));
    
    // Collect price details
    const priceDetails = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Price type:',
        choices: [
          { name: 'One-time', value: 'one_time' },
          { name: 'Recurring', value: 'recurring' }
        ]
      },
      {
        type: 'input',
        name: 'nickname',
        message: 'Price nickname (optional):',
      },
      {
        type: 'number',
        name: 'amount',
        message: 'Amount (in dollars):',
        validate: value => value > 0 ? true : 'Amount must be greater than 0'
      },
      {
        type: 'list',
        name: 'currency',
        message: 'Currency:',
        choices: ['usd', 'eur', 'gbp'],
        default: 'usd'
      }
    ]);
    
    let recurringDetails = {};
    if (priceDetails.type === 'recurring') {
      recurringDetails = await inquirer.prompt([
        {
          type: 'list',
          name: 'interval',
          message: 'Billing interval:',
          choices: ['day', 'week', 'month', 'year']
        },
        {
          type: 'number',
          name: 'interval_count',
          message: 'Interval count:',
          default: 1,
          validate: value => value > 0 ? true : 'Interval count must be greater than 0'
        }
      ]);
    }
    
    // Ask for custom metadata
    const { addMetadata } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addMetadata',
        message: 'Would you like to add custom metadata to this price?',
        default: false
      }
    ]);
    
    let metadata = {};
    if (addMetadata) {
      metadata = await editJsonInEditor({});
    }
    
    // Create price
    const spinner = ora('Creating price...').start();
    
    const priceData = {
      product: productId,
      nickname: priceDetails.nickname || undefined,
      unit_amount: Math.round(priceDetails.amount * 100), // Convert to cents
      currency: priceDetails.currency,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
    
    // Add recurring data if needed
    if (priceDetails.type === 'recurring') {
      priceData.recurring = {
        interval: recurringDetails.interval,
        interval_count: recurringDetails.interval_count
      };
    }
    
    const price = await stripe.prices.create(priceData);
    
    spinner.succeed('Price created successfully');
    console.log(boxen(prettyJson(price), {
      padding: 1,
      margin: 1,
      borderColor: 'green',
      title: `New Price Created: ${price.nickname || 'No Nickname'}`
    }));
    
  } catch (error) {
    console.error(chalk.red('Error creating price:'), error.message);
  }
}

// Command to view a price in detail
program
  .command('view')
  .description('View details of a Stripe price')
  .option('-a, --all', 'Include inactive prices')
  .option('-p, --product', 'Select by product first')
  .action(async (options) => {
    let selectedPrice;
    
    if (options.product) {
      const selectedProduct = await listAndSelectProduct();
      if (selectedProduct) {
        selectedPrice = await listAndSelectPrice(selectedProduct.id, options.all);
      }
    } else {
      selectedPrice = await listAndSelectPrice(null, options.all);
    }
    
    if (selectedPrice) {
      await showPriceDetails(selectedPrice.id);
    }
  });

// Command to view inactive products
program
  .command('inactive-products')
  .description('View and manage inactive products in Stripe')
  .action(async () => {
    try {
      console.log(chalk.blue('Fetching inactive products from Stripe...'));
      
      const spinner = ora('Loading inactive products...').start();
      const productsResponse = await stripe.products.list({
        limit: 100,
        active: false
      });
      
      if (productsResponse.data.length === 0) {
        spinner.info('No inactive products found');
        return;
      }
      
      spinner.succeed(`Found ${productsResponse.data.length} inactive products`);
      
      // Group products by app_name
      const groupedProducts = {};
      groupedProducts['Uncategorized'] = [];
      
      productsResponse.data.forEach(product => {
        const appName = product.metadata?.app_name || 'Uncategorized';
        if (!groupedProducts[appName]) {
          groupedProducts[appName] = [];
        }
        groupedProducts[appName].push(product);
      });
      
      // Display products grouped by app
      console.log(chalk.blue('\nInactive Products by Application:\n'));
      
      const appsArray = Object.keys(groupedProducts).filter(appName => 
        groupedProducts[appName].length > 0
      );
      
      for (let i = 0; i < appsArray.length; i++) {
        const appName = appsArray[i];
        console.log(chalk.cyan(`\n[${i + 1}] ${appName}\n`));
        
        const table = new Table({
          head: ['#', 'ID', 'Name', 'Created', 'Archived'],
          style: { head: ['cyan'] }
        });
        
        const productsInApp = groupedProducts[appName];
        productsInApp.forEach((product, index) => {
          const createdDate = new Date(product.created * 1000).toLocaleDateString();
          
          table.push([
            `${i + 1}.${index + 1}`,
            product.id.substring(0, 10) + '...',
            product.name,
            createdDate,
            chalk.red('Inactive')
          ]);
        });
        
        console.log(table.toString());
      }
      
      if (appsArray.length === 0) {
        console.log(chalk.yellow('No inactive products found'));
        return;
      }
      
      // Let user select an app first
      const { appIndex } = await inquirer.prompt([
        {
          type: 'number',
          name: 'appIndex',
          message: 'Select an application by number:',
          validate: (value) => {
            const num = parseInt(value);
            return num > 0 && num <= appsArray.length
              ? true
              : `Please enter a number between 1 and ${appsArray.length}`;
          }
        }
      ]);
      
      const selectedAppName = appsArray[appIndex - 1];
      const productsInSelectedApp = groupedProducts[selectedAppName];
      
      // Then let user select a product within that app
      const { productIndex } = await inquirer.prompt([
        {
          type: 'number',
          name: 'productIndex',
          message: `Select a product from ${selectedAppName} by number (after decimal point):`,
          validate: (value) => {
            const num = parseInt(value);
            return num > 0 && num <= productsInSelectedApp.length
              ? true
              : `Please enter a number between 1 and ${productsInSelectedApp.length}`;
          }
        }
      ]);
      
      const selectedProduct = productsInSelectedApp[productIndex - 1];
      
      // Show product details and actions
      console.log(boxen(prettyJson(selectedProduct), {
        padding: 1,
        margin: 1,
        borderColor: 'yellow',
        title: `Inactive Product: ${selectedProduct.name}`
      }));
      
      // Ask what to do with this inactive product
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do with this inactive product?',
          choices: [
            { name: 'Activate product', value: 'activate' },
            { name: 'Delete product permanently', value: 'delete' },
            { name: 'View associated prices', value: 'prices' },
            { name: 'Edit product metadata', value: 'edit-metadata' },
            { name: 'Back to main menu', value: 'back' }
          ]
        }
      ]);
      
      switch (action) {
        case 'activate':
          await toggleProductActive(selectedProduct.id, true);
          break;
          
        case 'delete':
          await deleteProduct(selectedProduct.id);
          break;
          
        case 'prices':
          // Show prices for this product
          const selectedPrice = await listAndSelectPrice(selectedProduct.id, true);
          if (selectedPrice) {
            await showPriceDetails(selectedPrice.id);
          }
          break;
          
        case 'edit-metadata':
          await editProductMetadata(selectedProduct.id);
          break;
          
        case 'back':
        default:
          // Return to main menu
          break;
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Command to delete a product and all its prices
program
  .command('delete-product')
  .description('Permanently delete a product and all associated prices')
  .action(async () => {
    try {
      console.log(chalk.red('⚠️  WARNING: This will permanently delete a product and all its prices ⚠️'));
      console.log(chalk.yellow('This action cannot be undone and will remove all data from Stripe.'));
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Do you understand the risks and want to continue?',
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.blue('Operation cancelled'));
        return;
      }
      
      // Include both active and inactive products
      console.log(chalk.yellow('Select a product to delete:'));
      const selectedProduct = await listAndSelectProduct(true);
      
      if (selectedProduct) {
        await deleteProduct(selectedProduct.id);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Helper function to delete a product and all associated prices
async function deleteProduct(productId) {
  // Double-check confirmation with product name
  try {
    const product = await stripe.products.retrieve(productId);
    
    const { confirmDelete } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you absolutely sure you want to delete "${product.name}" and ALL associated prices?`,
        default: false
      }
    ]);
    
    if (!confirmDelete) {
      console.log(chalk.blue('Deletion cancelled'));
      return;
    }
    
    // First, fetch all prices associated with this product
    const spinner = ora('Fetching associated prices...').start();
    const prices = await stripe.prices.list({
      product: productId,
      limit: 100
    });
    
    spinner.succeed(`Found ${prices.data.length} prices associated with this product`);
    
    // First deactivate any active prices
    const activePrices = prices.data.filter(price => price.active);
    if (activePrices.length > 0) {
      const deactivateSpinner = ora(`Deactivating ${activePrices.length} active prices...`).start();
      
      for (const price of activePrices) {
        await stripe.prices.update(price.id, { active: false });
      }
      
      deactivateSpinner.succeed('All prices deactivated');
    }
    
    // Now delete all prices (Stripe requires prices to be deleted before product)
    if (prices.data.length > 0) {
      const deletePricesSpinner = ora(`Deleting ${prices.data.length} prices...`).start();
      let deletedCount = 0;
      
      for (const price of prices.data) {
        try {
          // Note: Deleting prices is only supported in test mode or for prices with no subscription
          // For production use with subscriptions, we may need to just deactivate instead
          await stripe.prices.del(price.id);
          deletedCount++;
        } catch (priceError) {
          deletePricesSpinner.warn(`Could not delete price ${price.id}: ${priceError.message}`);
          console.log(chalk.yellow(`Note: Price ${price.id} remains deactivated but could not be deleted. This is normal for prices that have been used in subscriptions.`));
        }
      }
      
      if (deletedCount === prices.data.length) {
        deletePricesSpinner.succeed(`All ${deletedCount} prices deleted`);
      } else {
        deletePricesSpinner.succeed(`${deletedCount} out of ${prices.data.length} prices deleted`);
      }
      
      // Small pause to ensure Stripe API has processed all price deletions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Now try to delete the product
    const deleteSpinner = ora('Deleting product...').start();
    try {
      await stripe.products.del(productId);
      deleteSpinner.succeed(`Product "${product.name}" deleted successfully`);
      console.log(chalk.green('✅ Product and all associated prices have been removed from Stripe'));
    } catch (productError) {
      deleteSpinner.fail(`Could not delete product: ${productError.message}`);
      console.log(chalk.yellow('The product has been deactivated but could not be fully deleted.'));
      console.log(chalk.yellow('This typically happens when prices have been used in subscriptions.'));
    }
    
  } catch (error) {
    console.error(chalk.red('Error deleting product:'), error.message);
  }
}

// Command to run subscription reconciliation
program
  .command(reconciliationCommand.command)
  .description(reconciliationCommand.description)
  .action(reconciliationCommand.action);

// Command to create a new product
program
  .command('create-product')
  .description('Create a new product in Stripe')
  .action(async () => {
    try {
      console.log(chalk.blue('Create a new product in Stripe'));
      
      // Get existing apps/categories for reference
      const spinner = ora('Fetching existing products for reference...').start();
      let existingApps = ['Uncategorized'];
      
      try {
        const products = await stripe.products.list({ limit: 100 });
        const appMap = new Map();
        
        products.data.forEach(product => {
          if (product.metadata?.app_name) {
            appMap.set(product.metadata.app_name, true);
          }
        });
        
        if (appMap.size > 0) {
          existingApps = ['Uncategorized', ...Array.from(appMap.keys())];
        }
        
        spinner.succeed('Found existing applications');
      } catch (error) {
        spinner.fail('Failed to fetch products');
        console.log(chalk.yellow('Continuing with new product creation...'));
      }
      
      // Get product details
      const productDetails = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Product name:',
          validate: value => value.trim() !== '' ? true : 'Product name is required'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Product description (optional):',
        },
        {
          type: 'list',
          name: 'app_choice',
          message: 'Select an application category:',
          choices: [...existingApps, 'Create new application category']
        }
      ]);
      
      let appName = productDetails.app_choice;
      if (appName === 'Create new application category') {
        const { newAppName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'newAppName',
            message: 'Enter new application name:',
            validate: value => value.trim() !== '' ? true : 'Application name is required'
          }
        ]);
        appName = newAppName;
      } else if (appName === 'Uncategorized') {
        appName = undefined;
      }
      
      // Ask for additional metadata
      const { addMetadata } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addMetadata',
          message: 'Would you like to add additional metadata to this product?',
          default: false
        }
      ]);
      
      let metadata = appName ? { app_name: appName } : {};
      
      if (addMetadata) {
        console.log(chalk.yellow('Current metadata:'));
        console.log(prettyJson(metadata));
        
        const additionalMetadata = await editJsonInEditor(metadata);
        metadata = additionalMetadata || metadata;
      }
      
      // Create product
      const createSpinner = ora('Creating product...').start();
      const product = await stripe.products.create({
        name: productDetails.name,
        description: productDetails.description || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });
      
      createSpinner.succeed('Product created successfully');
      console.log(boxen(prettyJson(product), {
        padding: 1,
        margin: 1,
        borderColor: 'green',
        title: `New Product: ${product.name}`
      }));
      
      // Ask if user wants to create a price for this product
      const { createPrice } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createPrice',
          message: 'Would you like to create a price for this product now?',
          default: true
        }
      ]);
      
      if (createPrice) {
        await createNewPrice(product.id);
      }
      
    } catch (error) {
      console.error(chalk.red('Error creating product:'), error.message);
    }
  });

// Command to edit price metadata
program
  .command('edit-metadata')
  .description('Edit metadata of a Stripe price')
  .action(async () => {
    const selectedPrice = await listAndSelectPrice();
    
    if (selectedPrice) {
      await editPriceMetadata(selectedPrice.id);
    }
  });

// Default command to show help
program
  .action(() => {
    program.outputHelp();
  });

// Function to display main menu
async function showMainMenu() {
  // Clear the screen for a fresh start
  clear();
  
  // Display welcome banner with figlet
  console.log(
    chalk.cyan(figlet.textSync('Stripe CLI', { horizontalLayout: 'full' }))
  );
  console.log(boxen(
    `${chalk.bold('💳  Stripe MSaaS Manager')}\n\n` +
    `${chalk.blue('👤')} Connected as: ${chalk.green(stripeApiKey.substring(0, 7) + '...')}\n` +
    `${chalk.blue('🔧')} Mode: ${stripeApiKey.startsWith('sk_test') ? chalk.yellow('Test') : chalk.red('Live')}`,
    { padding: 1, margin: 1, borderColor: 'cyan' }
  ));
  
  // Display main menu
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: '✨ What would you like to do?',
      choices: [
        { name: '🔍 View Active Products', value: 'products' },
        { name: '📦 View Inactive Products', value: 'inactive-products' },
        { name: '➕ Create New Product', value: 'create-product' },
        { name: '🔍 View Prices', value: 'prices' },
        { name: '✏️ Edit Metadata', value: 'edit-metadata' },
        { name: '👥 View Subscriptions', value: 'subscriptions' },
        { name: '🔄 Run Subscription Reconciliation', value: 'reconcile' },
        { name: '❌ Delete Product', value: 'delete-product' },
        { name: '❓ Help & Info', value: 'help' },
        { name: '👋 Exit', value: 'exit' }
      ]
    }
  ]);
  
  switch (choice) {
    case 'prices':
      await viewPricesCommand({ all: false });
      break;
    case 'products':
      await viewProductsCommand({ all: false });
      break;
    case 'subscriptions':
      await viewSubscriptionsCommand();
      break;
    case 'inactive-products':
      await viewInactiveProductsCommand();
      break;
    case 'create-product':
      await createProductCommand();
      break;
    case 'reconcile':
      await reconciliationCommand.action();
      break;
    case 'edit':
      await editMetadataCommand();
      break;
    case 'activate':
      await activatePriceCommand();
      break;
    case 'deactivate':
      await deactivatePriceCommand();
      break;
    case 'delete':
      await deleteProductCommand();
      break;
    case 'help':
      showHelp();
      break;
    case 'exit':
      console.log(chalk.green('\n👋 Thank you for using the Stripe CLI!'));
      return;
  }
  
  // Prompt for return to main menu
  const { returnToMenu } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'returnToMenu',
      message: '🔙 Return to main menu?',
      default: true
    }
  ]);
  
  if (returnToMenu) {
    await showMainMenu();
  } else {
    console.log(chalk.green('\n👋 Thank you for using the Stripe CLI!'));
  }
}

// Function to display help information
function showHelp() {
  clear();
  console.log(boxen(
    chalk.bold('💳 Stripe CLI Help 📚') + '\n\n' +
    '🔍 View prices - List and select prices to view details\n' +
    '📦 Manage products - View and manage products grouped by app\n' +
    '🔄 Inactive products - View and manage deactivated products\n' +
    '➕ Create product - Create new products with application categorization\n' +
    '✏️ Edit metadata - Add custom data to prices\n' +
    '✅ Activate - Make a price available for purchase\n' +
    '🚫 Deactivate - Hide a price from customers\n' +
    '❌ Delete product - Permanently remove a product and its prices\n\n' +
    chalk.cyan('For more information, visit: https://stripe.com/docs'),
    { padding: 1, margin: 1, borderColor: 'blue' }
  ));
}

// Command handler wrappers for menu integration
async function viewPricesCommand(options) {
  const selectedPrice = await listAndSelectPrice(null, options.all);
  if (selectedPrice) {
    await showPriceDetails(selectedPrice.id);
  }
}

async function viewProductsCommand(options) {
  const selectedProduct = await listAndSelectProduct(options.all);
  
  if (selectedProduct) {
    // Fetch complete product details
    const spinner = ora('🔍 Fetching product details...').start();
    try {
      const product = await stripe.products.retrieve(selectedProduct.id);
      spinner.succeed('✅ Product details fetched');
      
      console.log(boxen(prettyJson(product), {
        padding: 1,
        margin: 1,
        borderColor: 'green',
        title: `📦 Product: ${product.name}`
      }));
      
      // Ask what to do with this product
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '🛠️  What would you like to do with this product?',
          choices: [
            { name: '🔍 View prices for this product', value: 'prices' },
            { name: '✏️  Edit product metadata', value: 'edit-metadata' },
            { name: product.active ? '🚫 Deactivate product' : '✅ Activate product', value: 'toggle-active' },
            { name: '➕ Create a new price for this product', value: 'create-price' },
            { name: '🔙 Back', value: 'back' }
          ]
        }
      ]);
      
      switch (action) {
        case 'prices':
          // Show prices for this product
          const includeInactive = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'include',
              message: '🔎 Include inactive prices?',
              default: false
            }
          ]);
          const selectedPrice = await listAndSelectPrice(product.id, includeInactive.include);
          if (selectedPrice) {
            await showPriceDetails(selectedPrice.id);
          }
          break;
        
        case 'edit-metadata':
          // Edit product metadata
          await editProductMetadata(product.id);
          break;
        
        case 'toggle-active':
          // Toggle product active status
          await toggleProductActive(product.id, !product.active);
          break;
        
        case 'create-price':
          // Create new price for this product
          await createNewPrice(product.id);
          break;
          
        case 'back':
        default:
          // Return to main menu
          break;
      }
    } catch (error) {
      spinner.fail('❌ Failed to fetch product details');
      console.error(chalk.red('Error:'), error.message);
    }
  }
}

async function viewInactiveProductsCommand() {
  try {
    console.log(chalk.blue('🔍 Fetching inactive products from Stripe...'));
    
    const spinner = ora('Loading inactive products...').start();
    const productsResponse = await stripe.products.list({
      limit: 100,
      active: false
    });
    
    if (productsResponse.data.length === 0) {
      spinner.info('ℹ️ No inactive products found');
      return;
    }
    
    spinner.succeed(`✅ Found ${productsResponse.data.length} inactive products`);
    
    // Group products by app_name
    const groupedProducts = {};
    groupedProducts['Uncategorized'] = [];
    
    productsResponse.data.forEach(product => {
      const appName = product.metadata?.app_name || 'Uncategorized';
      if (!groupedProducts[appName]) {
        groupedProducts[appName] = [];
      }
      groupedProducts[appName].push(product);
    });
    
    // Display products grouped by app
    console.log(chalk.blue('\n🗂️ Inactive Products by Application:\n'));
    
    const appsArray = Object.keys(groupedProducts).filter(appName => 
      groupedProducts[appName].length > 0
    );
    
    for (let i = 0; i < appsArray.length; i++) {
      const appName = appsArray[i];
      console.log(chalk.cyan(`\n[${i + 1}] ${appName}\n`));
      
      const table = new Table({
        head: ['#', 'ID', 'Name', 'Created', 'Status'],
        style: { head: ['cyan'] }
      });
      
      const productsInApp = groupedProducts[appName];
      productsInApp.forEach((product, index) => {
        const createdDate = new Date(product.created * 1000).toLocaleDateString();
        
        table.push([
          `${i + 1}.${index + 1}`,
          product.id.substring(0, 10) + '...',
          product.name,
          createdDate,
          chalk.red('🚫 Inactive')
        ]);
      });
      
      console.log(table.toString());
    }
    
    if (appsArray.length === 0) {
      console.log(chalk.yellow('ℹ️ No inactive products found'));
      return;
    }
    
    // Let user select an app first
    const { appIndex } = await inquirer.prompt([
      {
        type: 'number',
        name: 'appIndex',
        message: '🔢 Select an application by number:',
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= appsArray.length
            ? true
            : `Please enter a number between 1 and ${appsArray.length}`;
        }
      }
    ]);
    
    const selectedAppName = appsArray[appIndex - 1];
    const productsInSelectedApp = groupedProducts[selectedAppName];
    
    // Then let user select a product within that app
    const { productIndex } = await inquirer.prompt([
      {
        type: 'number',
        name: 'productIndex',
        message: `🔢 Select a product from ${selectedAppName} by number (after decimal point):`,
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= productsInSelectedApp.length
            ? true
            : `Please enter a number between 1 and ${productsInSelectedApp.length}`;
        }
      }
    ]);
    
    const selectedProduct = productsInSelectedApp[productIndex - 1];
    
    // Show product details and actions
    console.log(boxen(prettyJson(selectedProduct), {
      padding: 1,
      margin: 1,
      borderColor: 'yellow',
      title: `🚫 Inactive Product: ${selectedProduct.name}`
    }));
    
    // Ask what to do with this inactive product
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '🛠️ What would you like to do with this inactive product?',
        choices: [
          { name: '✅ Activate product', value: 'activate' },
          { name: '❌ Delete product permanently', value: 'delete' },
          { name: '🔍 View associated prices', value: 'prices' },
          { name: '✏️ Edit product metadata', value: 'edit-metadata' },
          { name: '🔙 Back', value: 'back' }
        ]
      }
    ]);
    
    switch (action) {
      case 'activate':
        await toggleProductActive(selectedProduct.id, true);
        break;
        
      case 'delete':
        await deleteProduct(selectedProduct.id);
        break;
        
      case 'prices':
        // Show prices for this product
        const selectedPrice = await listAndSelectPrice(selectedProduct.id, true);
        if (selectedPrice) {
          await showPriceDetails(selectedPrice.id);
        }
        break;
        
      case 'edit-metadata':
        await editProductMetadata(selectedProduct.id);
        break;
        
      case 'back':
      default:
        // Return to main menu
        break;
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

async function createProductCommand() {
  try {
    console.log(chalk.blue('➕ Create a new product in Stripe'));
    
    // Get existing apps/categories for reference
    const spinner = ora('🔍 Fetching existing products for reference...').start();
    let existingApps = ['Uncategorized'];
    
    try {
      const products = await stripe.products.list({ limit: 100 });
      const appMap = new Map();
      
      products.data.forEach(product => {
        if (product.metadata?.app_name) {
          appMap.set(product.metadata.app_name, true);
        }
      });
      
      if (appMap.size > 0) {
        existingApps = ['Uncategorized', ...Array.from(appMap.keys())];
      }
      
      spinner.succeed('✅ Found existing applications');
    } catch (error) {
      spinner.fail('❌ Failed to fetch products');
      console.log(chalk.yellow('⚠️ Continuing with new product creation...'));
    }
    
    // Get product details
    const productDetails = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '📝 Product name:',
        validate: value => value.trim() !== '' ? true : 'Product name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: '📝 Product description (optional):',
      },
      {
        type: 'list',
        name: 'app_choice',
        message: '🗂️ Select an application category:',
        choices: [...existingApps, 'Create new application category']
      }
    ]);
    
    let appName = productDetails.app_choice;
    if (appName === 'Create new application category') {
      const { newAppName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newAppName',
          message: '🏷️ Enter new application name:',
          validate: value => value.trim() !== '' ? true : 'Application name is required'
        }
      ]);
      appName = newAppName;
    } else if (appName === 'Uncategorized') {
      appName = undefined;
    }
    
    // Ask for additional metadata
    const { addMetadata } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addMetadata',
        message: '🔧 Would you like to add additional metadata to this product?',
        default: false
      }
    ]);
    
    let metadata = appName ? { app_name: appName } : {};
    
    if (addMetadata) {
      console.log(chalk.yellow('📋 Current metadata:'));
      console.log(prettyJson(metadata));
      
      const additionalMetadata = await editJsonInEditor(metadata);
      metadata = additionalMetadata || metadata;
    }
    
    // Create product
    const createSpinner = ora('🛠️ Creating product...').start();
    const product = await stripe.products.create({
      name: productDetails.name,
      description: productDetails.description || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    });
    
    createSpinner.succeed('✅ Product created successfully');
    console.log(boxen(prettyJson(product), {
      padding: 1,
      margin: 1,
      borderColor: 'green',
      title: `✨ New Product: ${product.name}`
    }));
    
    // Ask if user wants to create a price for this product
    const { createPrice } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createPrice',
        message: '💰 Would you like to create a price for this product now?',
        default: true
      }
    ]);
    
    if (createPrice) {
      await createNewPrice(product.id);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error creating product:'), error.message);
  }
}

async function editMetadataCommand() {
  const selectedPrice = await listAndSelectPrice();
  
  if (selectedPrice) {
    await editPriceMetadata(selectedPrice.id);
  }
}

async function activatePriceCommand() {
  console.log(chalk.blue('✅ Activate an inactive price'));
  
  const selectedPrice = await listAndSelectPrice(null, true, false);
  if (selectedPrice && !selectedPrice.active) {
    await togglePriceActive(selectedPrice.id, true);
  } else if (selectedPrice && selectedPrice.active) {
    console.log(chalk.yellow('⚠️ This price is already active'));
  }
}

async function deactivatePriceCommand() {
  console.log(chalk.blue('🚫 Deactivate an active price'));
  
  const selectedPrice = await listAndSelectPrice(null, true, true);
  if (selectedPrice && selectedPrice.active) {
    await togglePriceActive(selectedPrice.id, false);
  } else if (selectedPrice && !selectedPrice.active) {
    console.log(chalk.yellow('⚠️ This price is already inactive'));
  }
}

async function viewSubscriptionsCommand() {
  try {
    clear();
    console.log(chalk.blue('👥 View and filter Stripe subscriptions\n'));
    
    // Initial loading of subscriptions
    const spinner = ora('🔍 Loading subscriptions from Stripe...').start();
    
    try {
      // Fetch subscriptions with minimal expansion to avoid Stripe API limits
      const subscriptionsResponse = await stripe.subscriptions.list({
        limit: 100,
        expand: ['data.customer']
      });
      
      if (subscriptionsResponse.data.length === 0) {
        spinner.info('ℹ️ No subscriptions found');
        return;
      }
      
      spinner.succeed(`✅ Found ${subscriptionsResponse.data.length} subscriptions`);
      
      // Ask if user wants to filter the subscriptions
      const { filterChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'filterChoice',
          message: '🔎 Would you like to filter the subscriptions?',
          choices: [
            { name: 'Show all subscriptions', value: 'none' },
            { name: 'Filter by customer email', value: 'email' },
            { name: 'Filter by subscription date', value: 'date' },
            { name: 'Filter by status', value: 'status' }
          ]
        }
      ]);
      
      let filteredSubscriptions = [...subscriptionsResponse.data];
      
      // Apply filters based on user choice
      switch (filterChoice) {
        case 'email':
          const { emailQuery } = await inquirer.prompt([
            {
              type: 'input',
              name: 'emailQuery',
              message: '📧 Enter email filter (partial match is supported):',
              validate: value => value.trim() !== '' ? true : 'Please enter an email filter'
            }
          ]);
          
          filteredSubscriptions = filteredSubscriptions.filter(subscription => {
            if (subscription.customer && subscription.customer.email) {
              return subscription.customer.email.toLowerCase().includes(emailQuery.toLowerCase());
            }
            return false;
          });
          
          console.log(chalk.green(`🔍 Filtered to ${filteredSubscriptions.length} subscriptions matching email: "${emailQuery}"`));
          break;
          
        case 'date':
          const { dateOperation, dateValue } = await inquirer.prompt([
            {
              type: 'list',
              name: 'dateOperation',
              message: '📅 Select date filter operation:',
              choices: [
                { name: 'Created before', value: 'before' },
                { name: 'Created after', value: 'after' }
              ]
            },
            {
              type: 'input',
              name: 'dateValue',
              message: '📅 Enter date (YYYY-MM-DD):',
              validate: (value) => {
                // Simple date validation
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(value)) {
                  return 'Please enter a valid date in YYYY-MM-DD format';
                }
                return true;
              }
            }
          ]);
          
          const filterDate = new Date(dateValue);
          const filterTimestamp = Math.floor(filterDate.getTime() / 1000); // Convert to Unix timestamp (seconds)
          
          filteredSubscriptions = filteredSubscriptions.filter(subscription => {
            if (dateOperation === 'before') {
              return subscription.created < filterTimestamp;
            } else { // 'after'
              return subscription.created > filterTimestamp;
            }
          });
          
          console.log(chalk.green(`🔍 Filtered to ${filteredSubscriptions.length} subscriptions ${dateOperation} ${dateValue}`));
          break;
          
        case 'status':
          const { statusFilter } = await inquirer.prompt([
            {
              type: 'list',
              name: 'statusFilter',
              message: '📡 Select subscription status:',
              choices: [
                { name: '✅ Active', value: 'active' },
                { name: '⏸️ Trialing', value: 'trialing' },
                { name: '💸 Past due', value: 'past_due' },
                { name: '❌ Canceled', value: 'canceled' },
                { name: '⏹ Unpaid', value: 'unpaid' },
                { name: '⏳ Incomplete', value: 'incomplete' },
                { name: '🚫 Incomplete expired', value: 'incomplete_expired' }
              ]
            }
          ]);
          
          filteredSubscriptions = filteredSubscriptions.filter(subscription => 
            subscription.status === statusFilter
          );
          
          console.log(chalk.green(`🔍 Filtered to ${filteredSubscriptions.length} subscriptions with status: ${statusFilter}`));
          break;
      }
      
      if (filteredSubscriptions.length === 0) {
        console.log(chalk.yellow('\n⚠️ No subscriptions match the selected filter'));
        return;
      }
      
      // Display subscriptions in a table
      console.log(chalk.blue('\n📊 Subscription List:\n'));
      
      const table = new Table({
        head: ['#', 'Customer', 'Plan', 'Status', 'Created', 'Current Period'],
        style: { head: ['cyan'] },
        colWidths: [5, 30, 25, 15, 15, 25]
      });
      
      // Fetch price details for each subscription separately to get plan names
      const subscriptionPlanNames = {};
      
      // Process all subscriptions to extract plan names
      for (const subscription of filteredSubscriptions) {
        if (subscription.items.data.length > 0) {
          const firstItem = subscription.items.data[0];
          if (firstItem.price) {
            try {
              // Fetch price details including product
              const price = await stripe.prices.retrieve(firstItem.price.id, {
                expand: ['product']
              });
              
              // Get plan name from product name, price nickname, or metadata
              if (price.product && price.product.name) {
                subscriptionPlanNames[subscription.id] = price.product.name;
              } else if (price.nickname) {
                subscriptionPlanNames[subscription.id] = price.nickname;
              } else if (price.metadata && price.metadata.plan_name) {
                subscriptionPlanNames[subscription.id] = price.metadata.plan_name;
              }
            } catch (error) {
              console.error(chalk.yellow(`⚠️ Could not fetch price details for subscription ${subscription.id}: ${error.message}`));
            }
          }
        }
        
        // If we couldn't determine the plan name, use a default
        if (!subscriptionPlanNames[subscription.id]) {
          subscriptionPlanNames[subscription.id] = 'Unknown Plan';
        }
      }
      
      // Now display the subscriptions with their plan names
      filteredSubscriptions.forEach((subscription, index) => {
        const createdDate = new Date(subscription.created * 1000).toLocaleDateString();
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toLocaleDateString();
        
        // Use the fetched plan name
        const planName = subscriptionPlanNames[subscription.id];
        
        // Determine customer email
        const customerEmail = subscription.customer && subscription.customer.email 
          ? subscription.customer.email 
          : 'Unknown';
        
        // Determine status color
        let statusColor;
        switch (subscription.status) {
          case 'active':
            statusColor = chalk.green(`\u2705 ${subscription.status}`);
            break;
          case 'trialing':
            statusColor = chalk.blue(`\u23f8\ufe0f ${subscription.status}`);
            break;
          case 'past_due':
            statusColor = chalk.yellow(`\ud83d\udcb8 ${subscription.status}`);
            break;
          case 'canceled':
            statusColor = chalk.red(`\u274c ${subscription.status}`);
            break;
          default:
            statusColor = chalk.gray(`${subscription.status}`);
        }
        
        table.push([
          index + 1,
          customerEmail,
          planName,
          statusColor,
          createdDate,
          currentPeriodEnd
        ]);
      });
      
      console.log(table.toString());
      
      // Allow selection of a subscription to view details
      const { viewDetails } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'viewDetails',
          message: '🔍 View detailed information for a subscription?',
          default: false
        }
      ]);
      
      if (viewDetails) {
        const { subscriptionIndex } = await inquirer.prompt([
          {
            type: 'number',
            name: 'subscriptionIndex',
            message: '🔢 Select subscription by number:',
            validate: (value) => {
              const num = parseInt(value);
              return num > 0 && num <= filteredSubscriptions.length
                ? true
                : `Please enter a number between 1 and ${filteredSubscriptions.length}`;
            }
          }
        ]);
        
        const selectedSubscription = filteredSubscriptions[subscriptionIndex - 1];
        
        // Display full subscription details
        console.log(boxen(prettyJson(selectedSubscription), {
          padding: 1,
          margin: 1,
          borderColor: 'blue',
          title: `🎟️ Subscription Details`
        }));
        
        // Offer actions for the subscription
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '🛠️ What would you like to do with this subscription?',
            choices: [
              { name: '📨 Send receipt by email', value: 'receipt' },
              { name: '📑 View invoices', value: 'invoices' },
              { name: '🔙 Back', value: 'back' }
            ]
          }
        ]);
        
        // Handle subscription actions (future implementation)
        switch (action) {
          case 'receipt':
            console.log(chalk.yellow('\n⚠️ Email receipt functionality is not yet implemented'));
            break;
            
          case 'invoices':
            console.log(chalk.yellow('\n⚠️ Invoice viewing functionality is not yet implemented'));
            break;
            
          case 'back':
          default:
            // Return to main menu
            break;
        }
      }
      
    } catch (error) {
      spinner.fail(`❌ Error loading subscriptions: ${error.message}`);
      console.error(chalk.red('Error details:'), error);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

async function deleteProductCommand() {
  try {
    console.log(chalk.red('⚠️  WARNING: This will permanently delete a product and all its prices ⚠️'));
    console.log(chalk.yellow('This action cannot be undone and will remove all data from Stripe.'));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '⚠️ Do you understand the risks and want to continue?',
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.blue('✋ Operation cancelled'));
      return;
    }
    
    // Include both active and inactive products
    console.log(chalk.yellow('🔍 Select a product to delete:'));
    const selectedProduct = await listAndSelectProduct(true);
    
    if (selectedProduct) {
      await deleteProduct(selectedProduct.id);
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

// Process command line arguments and show menu
program.parse(process.argv);

// If no command was specified or interactive mode, show main menu
if (program.opts().interactive || program.opts().menu || process.argv.length <= 2) {
  (async () => {
    await showMainMenu();
  })();
}
