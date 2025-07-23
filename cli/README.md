# Stripe CLI Tool

An interactive command-line tool for managing Stripe prices.

## Features

- View all Stripe prices with interactive selection
- Display detailed price information with pretty-printed JSON
- Edit price metadata using your preferred text editor
- Real-time validation and notifications for changes

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
