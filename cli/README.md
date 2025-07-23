# Stripe CLI for MSaaS

A powerful interactive CLI tool to manage Stripe prices and products for multi-tenant SaaS applications.

![Stripe CLI](https://img.shields.io/badge/Stripe%20CLI-Interactive-brightgreen)

## Features

- ✨ Fully interactive main menu with all commands in one place
- 🔍 View and select Stripe prices with a formatted table
- 📦 Manage products by application categories
- 👥 View and filter subscriptions by customer email, date, or status
- 📊 View detailed JSON output for Stripe prices, products, and subscriptions
- ✏️ Edit price and product metadata using your preferred text editor
- 🔄 View and manage inactive products
- ⚡ Real-time validation and notifications for changes

## Available Commands

### `view [options]`
View and interact with Stripe prices.

Options:
- `-a, --all` - Show all prices (including inactive)
- `-j, --json` - Output in JSON format

### `edit-metadata`
Interactively edit metadata of a selected Stripe price.

### `activate`
Activate an inactive Stripe price.

### `deactivate`
Deactivate an active Stripe price.

### `products`
View and manage Stripe products grouped by applications.

### `create-product`
Create a new Stripe product with application categorization.
- Interactively prompt for product name, description, and application category
- Option to select existing application categories or create a new one
- Add custom metadata to the product
- Option to create a price for the product immediately

### `inactive-products`
View and manage inactive (archived) products in Stripe.
- List all deactivated products grouped by application
- View details of inactive products
- Reactivate products that were previously deactivated
- Delete inactive products permanently
- Edit metadata of inactive products
- View associated prices of inactive products

### `delete-product`
Permanently delete a product and all its associated prices.
- View and select from all products (active and inactive)
- Multiple confirmation steps to prevent accidental deletion
- Automatically deactivates any active prices before deletion
- Completely removes the product and all associated data from Stripe

## Prerequisites

- Node.js 14+ installed
- Stripe API key in the parent project's `.env` file (`STRIPE_SECRET_KEY`)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make the CLI executable:
   ```bash
   chmod +x stripe-cli.js
   ```

3. Optionally link the CLI for system-wide use:
   ```bash
   npm link
   ```

## Usage

### View Price Details

```bash
node stripe-cli.js view
```
This command will:
1. Fetch and list all active prices from your Stripe account
2. Allow you to select a price by its number
3. Display detailed information about the selected price, including nested fields

### Edit Price Metadata

```bash
node stripe-cli.js edit-metadata
```
This command will:
1. Fetch and list all active prices from your Stripe account
2. Allow you to select a price by its number
3. Open your default text editor to modify the price metadata as JSON
4. Update the price in Stripe with the new metadata
5. Display a success notification

## Environment Variables

- `STRIPE_SECRET_KEY`: Your Stripe secret API key (read from parent project's `.env`)
- `EDITOR`: (Optional) Your preferred text editor (defaults to vim if not specified)

## Tips

- For large Stripe accounts, you may want to add filtering options to the CLI
- You can extend this CLI with additional commands for other Stripe resources
