#!/bin/bash

# Define the .env.local file path
ENV_FILE=".env.local"

# --- Generate NEXTAUTH_SECRET ---
# Check if openssl is available
if command -v openssl &> /dev/null
then
    SECRET=$(openssl rand -base64 32)
    echo "Generated new NEXTAUTH_SECRET."
else
    echo "openssl not found. Please generate a random base64 string (e.g., 32 characters) and paste it below."
    echo "You can use an online generator or other tools."
    read -p "Enter your NEXTAUTH_SECRET: " SECRET
    if [ -z "$SECRET" ]; then
        echo "NEXTAUTH_SECRET cannot be empty. Exiting."
        exit 1
    fi
fi

# --- Define NEXTAUTH_URL ---
# Assuming default for local development
NEXTAUTH_URL="http://localhost:3000"

echo "Using NEXTAUTH_URL: $NEXTAUTH_URL"

# --- Update .env.local ---
echo "Updating $ENV_FILE..."

# Remove existing NEXTAUTH_SECRET and NEXTAUTH_URL lines if they exist
sed -i '/^NEXTAUTH_SECRET=/d' "$ENV_FILE" 2>/dev/null
sed -i '/^NEXTAUTH_URL=/d' "$ENV_FILE" 2>/dev/null

# Add new values
echo "NEXTAUTH_SECRET=$SECRET" >> "$ENV_FILE"
echo "NEXTAUTH_URL=$NEXTAUTH_URL" >> "$ENV_FILE"

echo "Successfully updated $ENV_FILE."
echo "Content of $ENV_FILE:"
cat "$ENV_FILE"

echo ""
echo "IMPORTANT: You need to restart your Next.js development server for these changes to take effect."
echo "Press Ctrl+C in your 'npm run dev' terminal, then run 'npm run dev' again."
