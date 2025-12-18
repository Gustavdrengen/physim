#!/usr/bin/env bash

set -e

APP_NAME="physim"              # Name of the command
BIN_DIR="/usr/local/bin"       # System-wide bin directory

# 1️⃣ Ensure /usr/local/bin is in PATH
if ! echo "$PATH" | grep -q "$BIN_DIR"; then
  echo "Error: $BIN_DIR is not in your PATH."
  exit 1
fi

# 2️⃣ Check for Deno
if ! command -v deno >/dev/null 2>&1; then
  echo "Deno not found. Installing Deno..."
  curl -fsSL https://deno.land/x/install/install.sh | sh
  export PATH="$HOME/.deno/bin:$PATH"
else
  echo "Deno is already installed."
fi

# 3️⃣ Create start script in /usr/local/bin
START_SCRIPT="$BIN_DIR/$APP_NAME"

echo "Creating start script at $START_SCRIPT (requires sudo)..."

sudo tee "$START_SCRIPT" > /dev/null <<EOF
#!/usr/bin/env bash
DENO_NO_UPDATE_CHECK=1 deno run --allow-net --allow-read --allow-env --allow-write --allow-run "$(pwd)/core/src/main.ts" "\$@"
EOF

sudo chmod +x "$START_SCRIPT"

echo "Installation complete! You can now run physim with:"
echo "  $APP_NAME"

